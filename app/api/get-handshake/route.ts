import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handshakeId = searchParams.get('id') || searchParams.get('handshakeId');

    if (!handshakeId) {
      return NextResponse.json(
        { error: 'handshakeId or id is required' },
        { status: 400 }
      );
    }

    // Create fresh client to avoid caching issues
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: { headers: { 'Cache-Control': 'no-cache' } }
    });

    const { data: handshake, error } = await supabase
      .from('handshakes')
      .select('*')
      .eq('id', handshakeId)
      .maybeSingle(); // Use maybeSingle to avoid cache

    console.log('[GET-HANDSHAKE] Handshake data:', {
      id: handshake?.id,
      status: handshake?.status,
      initiatorConsented: handshake?.initiator_consented,
      recipientConsented: handshake?.recipient_consented,
    });

    if (error || !handshake) {
      return NextResponse.json(
        { error: 'Handshake not found' },
        { status: 404 }
      );
    }

    // PRIVACY: Verify requester is part of this handshake
    const requesterId = searchParams.get('requesterId') || searchParams.get('profileId');
    if (requesterId) {
      const isParticipant = handshake.initiator_id === requesterId || handshake.recipient_id === requesterId;
      if (!isParticipant) {
        console.warn('[GET-HANDSHAKE] Privacy violation attempt:', {
          requesterId,
          handshakeId,
          actualParties: [handshake.initiator_id, handshake.recipient_id],
        });
        return NextResponse.json(
          { error: 'Access denied - not a participant in this handshake' },
          { status: 403 }
        );
      }
    } else {
      console.warn('[GET-HANDSHAKE] No requesterId provided - privacy check bypassed (legacy)');
    }

    // Fetch associated analysis - prioritize completed ones
    // First try to get completed analysis
    let { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('handshake_id', handshakeId)
      .eq('analysis_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no completed analysis, fall back to any analysis
    if (!analysis) {
      const { data: fallbackAnalysis } = await supabase
        .from('analyses')
        .select('*')
        .eq('handshake_id', handshakeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      analysis = fallbackAnalysis;
    }

    console.log('[GET-HANDSHAKE] Analysis found:', {
      id: analysis?.id,
      status: analysis?.analysis_status,
      hasOverlap: !!analysis?.overlap,
    });

    return NextResponse.json({
      handshake,
      analysis: analysis || null,
    });
  } catch (error) {
    console.error('Get handshake error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get handshake',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
