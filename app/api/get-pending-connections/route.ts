import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[GET-CONNECTIONS] ===== START =====');
    console.log('[GET-CONNECTIONS] ProfileId:', profileId);
    console.log('[GET-CONNECTIONS] Service key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // DEBUG: Check what handshakes exist at all
    const { data: allHandshakes, error: debugErr } = await supabase
      .from('handshakes')
      .select('id, initiator_id, recipient_id, status')
      .limit(10);
    console.log('[GET-CONNECTIONS] ALL handshakes in DB (max 10):', allHandshakes?.length || 0, allHandshakes);

    // Get all handshakes where this profile is initiator OR recipient
    // WORKAROUND: Fetch all and filter client-side since .eq() is failing
    const { data: allHandshakesForFilter, error: fetchErr } = await supabase
      .from('handshakes')
      .select(`
        id,
        initiator_id,
        recipient_id,
        status,
        initiator_consented,
        recipient_consented,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    console.log('[GET-CONNECTIONS] Fetched all handshakes for filtering:', allHandshakesForFilter?.length || 0);

    // Filter client-side
    const asInitiator = allHandshakesForFilter?.filter(h => h.initiator_id === profileId) || [];
    const asRecipient = allHandshakesForFilter?.filter(h => h.recipient_id === profileId) || [];
    const err1: { message: string } | null = null;
    const err2 = fetchErr;

    console.log('[GET-CONNECTIONS] INITIATOR query (.eq initiator_id):', {
      count: asInitiator?.length || 0,
      error: err1?.message || 'none',
      hasData: !!asInitiator && asInitiator.length > 0
    });

    console.log('[GET-CONNECTIONS] RECIPIENT query (.eq recipient_id):', {
      count: asRecipient?.length || 0,
      error: err2?.message || 'none',
      hasData: !!asRecipient && asRecipient.length > 0
    });

    const handshakeError = err1 || err2;
    const handshakes = [...(asInitiator || []), ...(asRecipient || [])];

    console.log('[GET-CONNECTIONS] COMBINED result:', {
      total: handshakes?.length || 0,
      fromInitiator: asInitiator?.length || 0,
      fromRecipient: asRecipient?.length || 0,
      error: handshakeError?.message || 'none'
    });
    console.log('[GET-CONNECTIONS] ===== END =====');

    if (handshakeError) {
      console.error('Handshake fetch error:', handshakeError);
      return NextResponse.json(
        { error: 'Failed to fetch connections', details: handshakeError.message },
        { status: 500 }
      );
    }

    if (!handshakes || handshakes.length === 0) {
      console.log('[GET-CONNECTIONS] No handshakes found for profile');
      return NextResponse.json({
        connections: [],
        debug: {
          profileId,
          asInitiatorCount: asInitiator?.length || 0,
          asRecipientCount: asRecipient?.length || 0,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          err1: err1?.message || null,
          err2: err2?.message || null
        }
      });
    }

    // Get all unique profile IDs we need to fetch (the other party in each handshake)
    const otherProfileIds = handshakes.map(h =>
      h.initiator_id === profileId ? h.recipient_id : h.initiator_id
    );

    // Fetch profile info for the other parties
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, role, mission')
      .in('id', otherProfileIds);

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // Build profile map for quick lookup
    const profileMap = new Map(
      (profiles || []).map(p => [p.id, p])
    );

    // Combine handshakes with profile data
    const connections = handshakes.map(h => {
      const isInitiator = h.initiator_id === profileId;
      const otherPartyId = isInitiator ? h.recipient_id : h.initiator_id;
      const otherParty = profileMap.get(otherPartyId);

      return {
        handshakeId: h.id,
        isInitiator,
        status: h.status,
        myConsent: isInitiator ? h.initiator_consented : h.recipient_consented,
        theirConsent: isInitiator ? h.recipient_consented : h.initiator_consented,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
        otherParty: otherParty ? {
          id: otherParty.id,
          displayName: otherParty.display_name,
          role: otherParty.role,
          mission: otherParty.mission,
        } : null,
      };
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Get pending connections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
