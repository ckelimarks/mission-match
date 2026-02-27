import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { initiatorId, recipientId } = await request.json();
    const deviceId = request.headers.get('x-device-id');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 401 }
      );
    }

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

    // Use authenticated Supabase client
    const supabase = createSupabaseClient(deviceId);

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

    // Create new handshake
    const { data: handshake, error: handshakeError } = await supabase
      .from('handshakes')
      .insert({
        initiator_id: initiatorId,
        recipient_id: recipientId,
        status: 'pending',
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

    // Trigger Stage 1 analysis in background (we'll implement this next)
    // For now, just return the handshake ID
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-stage1`, {
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
