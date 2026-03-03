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

    console.log('[GET-CONNECTIONS] Fetching for profileId:', profileId);

    // Get all handshakes where this profile is the initiator (someone scanned their QR)
    // Include both directions to show all connections
    const { data: handshakes, error: handshakeError } = await supabase
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
      .or(`initiator_id.eq.${profileId},recipient_id.eq.${profileId}`)
      .order('created_at', { ascending: false });

    console.log('[GET-CONNECTIONS] Query result:', {
      handshakeCount: handshakes?.length || 0,
      error: handshakeError?.message
    });

    if (handshakeError) {
      console.error('Handshake fetch error:', handshakeError);
      return NextResponse.json(
        { error: 'Failed to fetch connections', details: handshakeError.message },
        { status: 500 }
      );
    }

    if (!handshakes || handshakes.length === 0) {
      console.log('[GET-CONNECTIONS] No handshakes found for profile');
      return NextResponse.json({ connections: [] });
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
