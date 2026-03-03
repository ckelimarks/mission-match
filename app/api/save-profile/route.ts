import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ProfileInput } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept either { profileData: ... } or direct profile input
    const profileData = body.profileData || body;

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Detect format: new (has 'hook') vs legacy (has 'role' and 'mission')
    const isNewFormat = 'hook' in profileData;

    // Validate based on format
    if (isNewFormat) {
      if (!profileData.hook) {
        return NextResponse.json(
          { error: 'Missing required field: hook' },
          { status: 400 }
        );
      }
    } else {
      // Legacy format validation
      if (!profileData.role || !profileData.mission) {
        return NextResponse.json(
          { error: 'Missing required fields: role and mission (or use new format with hook)' },
          { status: 400 }
        );
      }
    }

    // Generate device ID and claim token
    const deviceId = crypto.randomUUID();
    const claimToken = crypto.randomUUID();

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build insert data based on format
    let insertData: Record<string, unknown>;

    if (isNewFormat) {
      // New format from rich extraction prompt
      const input = profileData as ProfileInput;

      // Extract display name from hook or collaboration_fit
      const displayName = input.collaboration_fit?.looking_for
        ? null // Will be set by user
        : null;

      // Map new format to database columns
      // Using existing JSONB columns for new structured data
      insertData = {
        device_id: deviceId,
        claim_token: claimToken,
        display_name: displayName,

        // Store hook in role field (repurposed)
        role: input.hook,

        // Store collaboration fit summary in mission
        mission: input.collaboration_fit?.looking_for || null,

        // Store proof points
        proof_points: input.proof_points || [],

        // Store looking_for from collaboration fit
        looking_for: input.collaboration_fit?.best_way_to_engage || null,

        // Store working style in role_aspects (repurposed JSONB)
        role_aspects: input.working_style || null,

        // Store collaboration fit in collaboration_aspects (repurposed JSONB)
        collaboration_aspects: input.collaboration_fit || null,

        // Store intellectual signature in shipping_aspects (repurposed JSONB)
        shipping_aspects: input.intellectual_signature || null,

        // Store contact info in communication_aspects (repurposed JSONB)
        communication_aspects: input.contact || null,

        // Store confidence and notes in decision_aspects (repurposed JSONB)
        decision_aspects: {
          profile_confidence: input.profile_confidence || 3,
          confidence_notes: input.confidence_notes || null,
        },

        // Calculate profile strength from confidence
        profile_strength: Math.min(5, Math.max(1, input.profile_confidence || 3)),
      };
    } else {
      // Legacy format
      insertData = {
        device_id: deviceId,
        claim_token: claimToken,
        display_name: profileData.display_name || null,
        role: profileData.role,
        mission: profileData.mission,
        proof_points: profileData.proof_points || [],
        looking_for: profileData.looking_for,
        role_aspects: profileData.role_aspects || null,
        shipping_aspects: profileData.shipping_aspects || null,
        communication_aspects: profileData.communication_aspects || null,
        decision_aspects: profileData.decision_aspects || null,
        energy_aspects: profileData.energy_aspects || null,
        collaboration_aspects: profileData.collaboration_aspects || null,
        profile_strength: profileData.profile_strength || 3,
      };
    }

    // Insert profile into Supabase
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert(insertData)
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
      deviceId,
      claimToken,
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
