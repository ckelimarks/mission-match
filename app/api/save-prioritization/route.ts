import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handshakeId, profileId, method, answers } = body;

    if (!handshakeId || !profileId || !method || !answers) {
      return NextResponse.json(
        { error: 'handshakeId, profileId, method, and answers are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if prioritization already exists
    const { data: existing } = await supabase
      .from('prioritizations')
      .select('*')
      .eq('handshake_id', handshakeId)
      .eq('profile_id', profileId)
      .single();

    if (existing) {
      // Delete existing and insert new (RLS workaround)
      await supabase
        .from('prioritizations')
        .delete()
        .eq('id', existing.id);
    }

    // Insert new prioritization
    const { data, error } = await supabase
      .from('prioritizations')
      .insert({
        handshake_id: handshakeId,
        profile_id: profileId,
        method,
        answers,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save prioritization:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save prioritization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save prioritization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
