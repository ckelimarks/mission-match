import { NextRequest, NextResponse } from 'next/server';
import { parseProfileJsonFields, toPublicProfile, toFullProfile } from '@/lib/profile-visibility';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || searchParams.get('id');
    const requesterId = searchParams.get('requesterId');
    const handshakeId = searchParams.get('handshakeId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId or id is required' },
        { status: 400 }
      );
    }

    // Fetch profile via REST API (no caching)
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${profileId}&select=*`,
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

    const profiles = await profileResponse.json();
    const rawProfile = profiles?.[0] || null;

    if (!rawProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = parseProfileJsonFields(rawProfile);

    // Case 1: Fetching your own profile — return full data
    if (requesterId && requesterId === profileId) {
      return NextResponse.json(toFullProfile(profile));
    }

    // Case 2: Handshake context with mutual consent — return full data
    if (handshakeId && requesterId) {
      const handshakeResponse = await fetch(
        `${supabaseUrl}/rest/v1/handshakes?id=eq.${handshakeId}&select=initiator_id,recipient_id,initiator_consented,recipient_consented`,
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
      const handshake = handshakes?.[0];

      if (handshake) {
        const isParticipant = handshake.initiator_id === requesterId || handshake.recipient_id === requesterId;
        const mutualConsent = handshake.initiator_consented && handshake.recipient_consented;

        if (isParticipant && mutualConsent) {
          return NextResponse.json(toFullProfile(profile));
        }
      }
    }

    // Default: public profile (Stage 1 view)
    return NextResponse.json(toPublicProfile(profile));
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
