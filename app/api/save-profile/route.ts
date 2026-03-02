import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { profileData } = await request.json();

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!profileData.role || !profileData.mission) {
      return NextResponse.json(
        { error: 'Missing required fields: role and mission are required' },
        { status: 400 }
      );
    }

    // Generate device ID and claim token
    const deviceId = crypto.randomUUID();
    const claimToken = crypto.randomUUID();

    // Insert profile into Supabase
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        device_id: deviceId,
        claim_token: claimToken,
        display_name: null, // User can set this later
        role: profileData.role,
        mission: profileData.mission,
        proof_points: profileData.proof_points || [],
        looking_for: profileData.looking_for,
        role_aspects: profileData.role_aspects,
        shipping_aspects: profileData.shipping_aspects,
        communication_aspects: profileData.communication_aspects,
        decision_aspects: profileData.decision_aspects,
        energy_aspects: profileData.energy_aspects,
        collaboration_aspects: profileData.collaboration_aspects,
        profile_strength: profileData.profile_strength || 3,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save profile to database', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profileId: profile.id,
      deviceId, // Return device ID so client can store it
      claimToken, // Return claim token for reclaim QR
      profile,
      message: 'Profile created successfully',
    });
  } catch (error) {
    console.error('Save profile error:', error);

    return NextResponse.json(
      {
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
