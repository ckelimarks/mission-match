import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseProfileJsonFields, toPublicProfile, toFullProfile } from '@/lib/profile-visibility';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || searchParams.get('id');
    const handshakeId = searchParams.get('handshakeId');
    const requesterId = searchParams.get('requesterId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId or id is required' },
        { status: 400 }
      );
    }

    // Use anon key for profile reads — profiles are publicly readable via RLS.
    // Only use service key for the handshake consent check below.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Fetch profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = parseProfileJsonFields(data as Record<string, any>);

    // Case 1: Fetching your own profile — return full data
    if (requesterId && requesterId === profileId) {
      return NextResponse.json(toFullProfile(profile));
    }

    // Case 2: Handshake context with mutual consent — return full data
    if (handshakeId && requesterId && supabaseServiceKey) {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });

      const { data: handshake } = await serviceClient
        .from('handshakes')
        .select('initiator_id, recipient_id, initiator_consented, recipient_consented')
        .eq('id', handshakeId)
        .maybeSingle();

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
