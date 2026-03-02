import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let handshakeId: string | undefined;

  try {
    const body = await request.json();
    handshakeId = body.handshakeId;
    const profileId = body.profileId; // Who is granting consent

    if (!handshakeId || !profileId) {
      return NextResponse.json(
        { error: 'handshakeId and profileId are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current handshake state
    const { data: handshake, error: fetchError } = await supabase
      .from('handshakes')
      .select('*')
      .eq('id', handshakeId)
      .single();

    if (fetchError || !handshake) {
      return NextResponse.json(
        { error: 'Handshake not found' },
        { status: 404 }
      );
    }

    // Determine which party is granting consent
    const isInitiator = handshake.initiator_id === profileId;
    const isRecipient = handshake.recipient_id === profileId;

    if (!isInitiator && !isRecipient) {
      return NextResponse.json(
        { error: 'You are not part of this handshake' },
        { status: 403 }
      );
    }

    // Update consent flag
    const updateData: any = {};
    if (isInitiator) {
      updateData.initiator_consented = true;
    } else {
      updateData.recipient_consented = true;
    }

    // Check if this creates mutual consent
    const newInitiatorConsent = isInitiator ? true : handshake.initiator_consented;
    const newRecipientConsent = isRecipient ? true : handshake.recipient_consented;
    const mutualConsent = newInitiatorConsent && newRecipientConsent;

    if (mutualConsent) {
      updateData.status = 'approved';
      updateData.mutual_consent_token = crypto.randomUUID();
    }

    // Update handshake
    const { error: updateError } = await supabase
      .from('handshakes')
      .update(updateData)
      .eq('id', handshakeId);

    if (updateError) {
      console.error('Failed to update handshake consent:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // If mutual consent achieved, trigger Stage 2 analysis
    if (mutualConsent) {
      // Create Stage 2 analysis record
      await supabase
        .from('analyses')
        .insert({
          handshake_id: handshakeId,
          stage: 2,
          analysis_status: 'pending',
        });

      // TODO: Trigger Stage 2 analysis in background
      // For now, we'll leave it pending and implement later
    }

    return NextResponse.json({
      success: true,
      mutualConsent,
      message: mutualConsent
        ? 'Mutual consent granted! Full profiles unlocked.'
        : 'Consent granted. Waiting for other party to consent.',
    });
  } catch (error) {
    console.error('Grant consent error:', error);

    return NextResponse.json(
      {
        error: 'Failed to grant consent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
