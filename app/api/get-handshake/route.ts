import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handshakeId = searchParams.get('id') || searchParams.get('handshakeId');

    if (!handshakeId) {
      return NextResponse.json(
        { error: 'handshakeId or id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: handshake, error } = await supabase
      .from('handshakes')
      .select('*')
      .eq('id', handshakeId)
      .single();

    if (error || !handshake) {
      return NextResponse.json(
        { error: 'Handshake not found' },
        { status: 404 }
      );
    }

    // Fetch associated analysis
    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('handshake_id', handshakeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      handshake,
      analysis: analysis || null,
    });
  } catch (error) {
    console.error('Get handshake error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get handshake',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
