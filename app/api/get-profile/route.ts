import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || searchParams.get('id');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profileId or id is required' },
        { status: 400 }
      );
    }

    // Profiles are publicly readable per RLS policy
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
    const profile = data as Record<string, any> | null;

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields that are stored as strings
    const parsedProfile: Record<string, any> = {
      ...profile,
      proof_points: typeof profile.proof_points === 'string'
        ? JSON.parse(profile.proof_points)
        : profile.proof_points,
      role_aspects: typeof profile.role_aspects === 'string'
        ? JSON.parse(profile.role_aspects)
        : profile.role_aspects,
      shipping_aspects: typeof profile.shipping_aspects === 'string'
        ? JSON.parse(profile.shipping_aspects)
        : profile.shipping_aspects,
      communication_aspects: typeof profile.communication_aspects === 'string'
        ? JSON.parse(profile.communication_aspects)
        : profile.communication_aspects,
      decision_aspects: typeof profile.decision_aspects === 'string'
        ? JSON.parse(profile.decision_aspects)
        : profile.decision_aspects,
      energy_aspects: typeof profile.energy_aspects === 'string'
        ? JSON.parse(profile.energy_aspects)
        : profile.energy_aspects,
      collaboration_aspects: typeof profile.collaboration_aspects === 'string'
        ? JSON.parse(profile.collaboration_aspects)
        : profile.collaboration_aspects,
      working_style: typeof profile.working_style === 'string'
        ? JSON.parse(profile.working_style)
        : profile.working_style,
    };

    // Return profile data directly (not wrapped in { profile })
    return NextResponse.json(parsedProfile);
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
