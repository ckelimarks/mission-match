import { NextRequest, NextResponse } from 'next/server';
import { extractProfile } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { conversationText } = await request.json();

    if (!conversationText || conversationText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conversation text is required' },
        { status: 400 }
      );
    }

    // Check text length (basic validation)
    if (conversationText.length < 100) {
      return NextResponse.json(
        { error: 'Conversation history too short. Need at least 100 characters for meaningful extraction.' },
        { status: 400 }
      );
    }

    // Extract profile using Claude
    console.log('Extracting profile from conversation...');
    const extractedData = await extractProfile(conversationText);

    // Get device ID from client (would come from header in production)
    // For now, generate a new one server-side for testing
    const deviceId = crypto.randomUUID();

    // Insert profile into Supabase
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        device_id: deviceId,
        display_name: null, // User can set this later
        role: extractedData.role,
        mission: extractedData.mission,
        proof_points: extractedData.proof_points,
        looking_for: extractedData.looking_for,
        role_aspects: extractedData.role_aspects,
        shipping_aspects: extractedData.shipping_aspects,
        communication_aspects: extractedData.communication_aspects,
        decision_aspects: extractedData.decision_aspects,
        energy_aspects: extractedData.energy_aspects,
        collaboration_aspects: extractedData.collaboration_aspects,
        profile_strength: extractedData.profile_strength,
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
      profile,
      message: 'Profile created successfully',
    });
  } catch (error) {
    console.error('Extract profile error:', error);

    return NextResponse.json(
      {
        error: 'Failed to extract profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
