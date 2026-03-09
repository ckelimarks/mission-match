import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId is required' },
        { status: 400 }
      );
    }

    console.log('[DELETE-PROFILE] Deleting profile and all associated data:', profileId);

    // Delete in order: analyses → handshakes → profile (due to foreign keys)

    // 1. Get all handshakes for this profile
    const handshakesRes = await fetch(
      `${supabaseUrl}/rest/v1/handshakes?or=(initiator_id.eq.${profileId},recipient_id.eq.${profileId})&select=id`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    const handshakes = await handshakesRes.json();
    const handshakeIds = handshakes?.map((h: any) => h.id) || [];

    // 2. Delete analyses for those handshakes
    if (handshakeIds.length > 0) {
      await fetch(
        `${supabaseUrl}/rest/v1/analyses?handshake_id=in.(${handshakeIds.join(',')})`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );
      console.log('[DELETE-PROFILE] Deleted analyses for', handshakeIds.length, 'handshakes');
    }

    // 3. Delete handshakes
    await fetch(
      `${supabaseUrl}/rest/v1/handshakes?or=(initiator_id.eq.${profileId},recipient_id.eq.${profileId})`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    console.log('[DELETE-PROFILE] Deleted handshakes');

    // 4. Delete the profile
    const deleteRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${profileId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal',
        },
      }
    );

    if (!deleteRes.ok) {
      const error = await deleteRes.text();
      console.error('[DELETE-PROFILE] Failed to delete profile:', error);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    console.log('[DELETE-PROFILE] Successfully deleted profile:', profileId);

    return NextResponse.json({
      success: true,
      message: 'Profile and all associated data permanently deleted',
    });
  } catch (error) {
    console.error('[DELETE-PROFILE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
