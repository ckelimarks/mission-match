import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnthropic } from '@/lib/anthropic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  let handshakeId: string | undefined;

  try {
    const body = await request.json();
    handshakeId = body.handshakeId;

    if (!handshakeId) {
      return NextResponse.json(
        { error: 'handshakeId is required' },
        { status: 400 }
      );
    }

    // Use service role key to bypass RLS for analysis
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get handshake with both profiles
    const { data: handshake, error: handshakeError } = await supabase
      .from('handshakes')
      .select(`
        id,
        initiator:initiator_id(id, role, mission, proof_points, looking_for),
        recipient:recipient_id(id, role, mission, proof_points, looking_for)
      `)
      .eq('id', handshakeId)
      .single();

    if (handshakeError || !handshake) {
      return NextResponse.json(
        { error: 'Handshake not found' },
        { status: 404 }
      );
    }

    // Call Claude for Stage 1 analysis
    const analysisPrompt = `Analyze these two collaboration profiles and identify overlap areas for a productive first conversation.

**Person A:**
Role: ${(handshake.initiator as any).role}
Mission: ${(handshake.initiator as any).mission}
Looking for: ${(handshake.initiator as any).looking_for}

**Person B:**
Role: ${(handshake.recipient as any).role}
Mission: ${(handshake.recipient as any).mission}
Looking for: ${(handshake.recipient as any).looking_for}

Identify 3-5 overlap areas and generate 3-5 conversation starters. Return ONLY valid JSON:

\`\`\`json
{
  "overlap": [
    {
      "category": "Shared Interest",
      "items": ["item1", "item2"],
      "why_matters": "Brief explanation"
    }
  ],
  "conversation_starters": [
    "Specific question or topic to discuss"
  ]
}
\`\`\``;

    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) ||
                      content.text.match(/```\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : content.text;
    const analysis = JSON.parse(jsonText);

    // Update analysis in database
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        overlap: analysis.overlap,
        conversation_starters: analysis.conversation_starters,
        analysis_status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('handshake_id', handshakeId)
      .eq('stage', 1);

    if (updateError) {
      console.error('Failed to update analysis:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Update handshake status
    await supabase
      .from('handshakes')
      .update({ status: 'awaiting_consent' })
      .eq('id', handshakeId);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Stage 1 analysis error:', error);

    // Mark analysis as failed
    if (handshakeId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('analyses')
        .update({
          analysis_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('handshake_id', handshakeId)
        .eq('stage', 1);
    }

    return NextResponse.json(
      {
        error: 'Failed to analyze profiles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
