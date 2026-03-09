import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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

    // Use direct REST API to bypass Supabase JS client caching
    const handshakeResponse = await fetch(
      `${supabaseUrl}/rest/v1/handshakes?id=eq.${handshakeId}&select=*`,
      {
        cache: 'no-store',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );

    const handshakes = await handshakeResponse.json();
    const handshake = handshakes?.[0] || null;

    console.log('[GET-HANDSHAKE] REST API result:', {
      id: handshake?.id,
      status: handshake?.status,
      initiatorConsented: handshake?.initiator_consented,
      recipientConsented: handshake?.recipient_consented,
    });

    if (!handshake) {
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
    }

    // Fetch associated analysis via REST API
    const analysisResponse = await fetch(
      `${supabaseUrl}/rest/v1/analyses?handshake_id=eq.${handshakeId}&analysis_status=eq.completed&order=created_at.desc&limit=1`,
      {
        cache: 'no-store',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );

    let analyses = await analysisResponse.json();
    let analysis = analyses?.[0] || null;

    // If no completed analysis, fall back to any analysis
    if (!analysis) {
      const fallbackResponse = await fetch(
        `${supabaseUrl}/rest/v1/analyses?handshake_id=eq.${handshakeId}&order=created_at.desc&limit=1`,
        {
          cache: 'no-store',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        }
      );
      const fallbackAnalyses = await fallbackResponse.json();
      analysis = fallbackAnalyses?.[0] || null;
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
