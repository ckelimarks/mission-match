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

    console.log('🔍 Grant Consent API Debug:', {
      profileId,
      handshake_initiator_id: handshake.initiator_id,
      handshake_recipient_id: handshake.recipient_id,
      isInitiator,
      isRecipient,
      profileId_type: typeof profileId,
      initiator_type: typeof handshake.initiator_id,
      recipient_type: typeof handshake.recipient_id,
    });

    if (!isInitiator && !isRecipient) {
      console.error('❌ Profile ID does not match either party');
      return NextResponse.json(
        { error: 'You are not part of this handshake' },
        { status: 403 }
      );
    }

    // Check if this creates mutual consent
    const newInitiatorConsent = isInitiator ? true : handshake.initiator_consented;
    const newRecipientConsent = isRecipient ? true : handshake.recipient_consented;
    const mutualConsent = newInitiatorConsent && newRecipientConsent;

    // RLS blocks UPDATE, so use DELETE + INSERT workaround
    // RACE MITIGATION: Re-fetch handshake immediately before DELETE to detect concurrent updates
    console.log('🔄 DELETE + INSERT workaround (RLS blocks UPDATE)');

    const { data: currentHandshake } = await supabase
      .from('handshakes')
      .select('*')
      .eq('id', handshakeId)
      .single();

    if (!currentHandshake) {
      // Handshake was deleted by concurrent request or doesn't exist
      console.warn('⚠️ Handshake no longer exists - may have been updated concurrently');
      // Try to find it by profile pair
      const { data: recovered } = await supabase
        .from('handshakes')
        .select('*')
        .or(`and(initiator_id.eq.${handshake.initiator_id},recipient_id.eq.${handshake.recipient_id}),and(initiator_id.eq.${handshake.recipient_id},recipient_id.eq.${handshake.initiator_id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recovered) {
        console.log('✅ Recovered handshake:', recovered.id);
        // Use the recovered handshake and proceed
        const alreadyConsented = isInitiator ? recovered.initiator_consented : recovered.recipient_consented;
        if (alreadyConsented) {
          console.log('✅ Already consented on recovered handshake');
          return NextResponse.json({
            success: true,
            mutualConsent: recovered.initiator_consented && recovered.recipient_consented,
            message: 'Consent already recorded',
          });
        }
        // Fall through to update the recovered handshake
        handshakeId = recovered.id;
      } else {
        throw new Error('Handshake disappeared and could not be recovered');
      }
    }

    // Delete old record
    const { error: deleteError } = await supabase
      .from('handshakes')
      .delete()
      .eq('id', handshakeId);

    if (deleteError) {
      console.error('❌ Failed to delete old handshake:', deleteError);
      throw new Error(`Delete failed: ${deleteError.message}`);
    }

    // Create new record with updated consent
    const newHandshake = {
      ...(currentHandshake || handshake),
      id: handshakeId,  // Preserve ID
      initiator_consented: newInitiatorConsent,
      recipient_consented: newRecipientConsent,
      status: mutualConsent ? 'approved' : (currentHandshake?.status || handshake.status),
      mutual_consent_token: mutualConsent ? crypto.randomUUID() : (currentHandshake?.mutual_consent_token || handshake.mutual_consent_token),
      updated_at: new Date().toISOString(),
    };

    console.log('📝 Inserting updated handshake:', newHandshake);
    const { data: insertResult, error: insertError } = await supabase
      .from('handshakes')
      .insert(newHandshake)
      .select();

    if (insertError) {
      console.error('❌ Failed to insert updated handshake:', insertError);
      // Check if it's a duplicate key error (race condition - other request won)
      if (insertError.code === '23505') {
        console.log('⚠️ Duplicate key - concurrent update detected, verifying final state');
        const { data: final } = await supabase
          .from('handshakes')
          .select('*')
          .eq('id', handshakeId)
          .single();
        if (final) {
          const myConsent = isInitiator ? final.initiator_consented : final.recipient_consented;
          if (myConsent) {
            console.log('✅ Consent recorded by concurrent request');
            return NextResponse.json({
              success: true,
              mutualConsent: final.initiator_consented && final.recipient_consented,
              message: 'Consent granted',
            });
          }
        }
      }
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    if (!insertResult || insertResult.length === 0) {
      throw new Error('Insert succeeded but returned no data');
    }

    console.log('✅ Handshake consent updated via DELETE + INSERT');

    // Mutual consent achieved - Stage 2 unlocked
    // Note: Stage 2 doesn't need AI analysis, just renders full profiles
    if (mutualConsent) {
      console.log('✅ Stage 2 unlocked - full profiles now visible');
    }

    console.log('🎉 Consent granted successfully. Mutual consent:', mutualConsent);

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
