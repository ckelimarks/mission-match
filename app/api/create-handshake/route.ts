import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { initiatorId, recipientId } = await request.json();

    console.log('[CREATE-HANDSHAKE] Request:', {
      initiatorId,
      recipientId,
      initiatorExists: !!initiatorId,
      recipientExists: !!recipientId
    });

    if (!initiatorId || !recipientId) {
      console.log('[CREATE-HANDSHAKE] Missing IDs');
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

    // Check if handshake already exists (symmetric check)
    const { data: existingHandshakes, error: checkError } = await supabase
      .from('handshakes')
      .select('id, status, created_at')
      .or(`and(initiator_id.eq.${initiatorId},recipient_id.eq.${recipientId}),and(initiator_id.eq.${recipientId},recipient_id.eq.${initiatorId})`);

    if (checkError) {
      console.error('[CREATE-HANDSHAKE] Check failed:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing handshakes', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingHandshakes && existingHandshakes.length > 0) {
      // Use most recent if duplicates exist
      const latest = existingHandshakes.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      console.log('[CREATE-HANDSHAKE] Already exists:', latest.id,
        existingHandshakes.length > 1 ? `(WARNING: ${existingHandshakes.length} duplicates found)` : '');

      return NextResponse.json({
        handshakeId: latest.id,
        existing: true,
        message: 'Handshake already exists',
      });
    }

    // Verify both profiles exist before creating handshake
    const { data: initiatorProfile, error: initiatorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', initiatorId)
      .single();

    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', recipientId)
      .single();

    console.log('[CREATE-HANDSHAKE] Profile verification:', {
      initiator: initiatorProfile ? 'EXISTS' : 'NOT FOUND',
      recipient: recipientProfile ? 'EXISTS' : 'NOT FOUND',
      initiatorError: initiatorError?.message,
      recipientError: recipientError?.message
    });

    if (!initiatorProfile) {
      return NextResponse.json(
        {
          error: 'Initiator profile not found',
          details: `Profile ${initiatorId} does not exist in the database`,
          hint: 'The initiator needs to create a profile first'
        },
        { status: 400 }
      );
    }

    if (!recipientProfile) {
      return NextResponse.json(
        {
          error: 'Recipient profile not found',
          details: `Profile ${recipientId} does not exist in the database`,
          hint: 'The recipient needs to create a profile first'
        },
        { status: 400 }
      );
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

      // Check if it's a foreign key constraint error
      const isForeignKeyError = handshakeError.message?.includes('foreign key') || handshakeError.code === '23503';

      return NextResponse.json(
        {
          error: isForeignKeyError
            ? 'Profile not found. Please create your profile first.'
            : 'Failed to create handshake',
          details: handshakeError.message,
          code: handshakeError.code,
          hint: isForeignKeyError
            ? 'One or both profiles do not exist. Make sure both users have created profiles before initiating a handshake.'
            : undefined
        },
        { status: isForeignKeyError ? 400 : 500 }
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

    console.log('[CREATE-HANDSHAKE] Created successfully:', handshake.id);
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
