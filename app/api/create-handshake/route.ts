import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { initiatorId, recipientId } = await request.json();

    if (!initiatorId || !recipientId) {
      return NextResponse.json(
        { error: 'Both initiatorId and recipientId are required' },
        { status: 400 }
      );
    }

    if (initiatorId === recipientId) {
      return NextResponse.json(
        { error: 'Cannot create handshake with yourself' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Using service key:', supabaseServiceKey ? 'YES (length: ' + supabaseServiceKey.length + ')' : 'NO');

    // Check if handshake already exists
    const { data: existingHandshake } = await supabase
      .from('handshakes')
      .select('id, status')
      .or(`and(initiator_id.eq.${initiatorId},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${initiatorId})`)
      .single();

    if (existingHandshake) {
      // Handshake already exists, return it
      return NextResponse.json({
        handshakeId: existingHandshake.id,
        existing: true,
        message: 'Handshake already exists',
      });
    }

    // Create new handshake - Stage 1 consent is implicit (QR scan = consent)
    const { data: handshake, error: handshakeError } = await supabase
      .from('handshakes')
      .insert({
        initiator_id: initiatorId,
        recipient_id: recipientId,
        status: 'stage1_complete', // QR scan implies Stage 1 consent
      })
      .select()
      .single();

    if (handshakeError) {
      console.error('Handshake creation error:', handshakeError);
      return NextResponse.json(
        { error: 'Failed to create handshake', details: handshakeError.message },
        { status: 500 }
      );
    }

    // Create Stage 1 analysis (will be processed asynchronously)
    const { error: analysisError } = await supabase
      .from('analyses')
      .insert({
        handshake_id: handshake.id,
        stage: 1,
        analysis_status: 'pending',
      });

    if (analysisError) {
      console.error('Analysis creation error:', analysisError);
      // Don't fail the handshake creation, just log the error
    }

    // Trigger Stage 1 analysis in background
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    fetch(`${baseUrl}/api/analyze-stage1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handshakeId: handshake.id }),
    }).catch(err => console.error('Failed to trigger analysis:', err));

    return NextResponse.json({
      handshakeId: handshake.id,
      message: 'Handshake created successfully',
    });
  } catch (error) {
    console.error('Create handshake error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create handshake',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
