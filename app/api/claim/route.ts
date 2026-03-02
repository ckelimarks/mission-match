import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Claim token is required' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find profile by claim token
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, display_name, role, device_id')
      .eq('claim_token', token)
      .single();

    if (findError || !profile) {
      return NextResponse.json(
        { error: 'Invalid claim token. This QR code may be expired or invalid.' },
        { status: 404 }
      );
    }

    // Generate new device ID for this device
    const newDeviceId = crypto.randomUUID();

    // Update the profile with the new device ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ device_id: newDeviceId })
      .eq('claim_token', token);

    if (updateError) {
      console.error('Failed to update device_id:', updateError);
      return NextResponse.json(
        { error: 'Failed to claim profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      deviceId: newDeviceId,
      displayName: profile.display_name,
      role: profile.role,
      message: 'Profile claimed successfully',
    });
  } catch (error) {
    console.error('Claim profile error:', error);

    return NextResponse.json(
      {
        error: 'Failed to claim profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for verifying token without claiming
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Claim token is required' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find profile by claim token (only return non-sensitive info)
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, display_name, role, mission')
      .eq('claim_token', token)
      .single();

    if (findError || !profile) {
      return NextResponse.json(
        { error: 'Invalid claim token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      profileId: profile.id,
      displayName: profile.display_name,
      role: profile.role,
      mission: profile.mission,
    });
  } catch (error) {
    console.error('Verify claim token error:', error);

    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
