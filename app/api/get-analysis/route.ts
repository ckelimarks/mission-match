import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handshakeId = searchParams.get('handshakeId');
    const stage = parseInt(searchParams.get('stage') || '1');

    if (!handshakeId) {
      return NextResponse.json(
        { error: 'handshakeId is required' },
        { status: 400 }
      );
    }

    // Get analysis for this handshake and stage
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('handshake_id', handshakeId)
      .eq('stage', stage)
      .single();

    if (error || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
