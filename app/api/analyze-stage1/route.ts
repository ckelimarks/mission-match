import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { anthropic } from '@/lib/anthropic';

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

    // Get handshake with both profiles - fetch all fields for rich analysis
    const { data: handshake, error: handshakeError } = await supabase
      .from('handshakes')
      .select(`
        id,
        initiator:initiator_id(
          id, hook, role, mission, proof_points, looking_for,
          working_style, collaboration_fit, profile_confidence
        ),
        recipient:recipient_id(
          id, hook, role, mission, proof_points, looking_for,
          working_style, collaboration_fit, profile_confidence
        )
      `)
      .eq('id', handshakeId)
      .single();

    if (handshakeError || !handshake) {
      return NextResponse.json(
        { error: 'Handshake not found' },
        { status: 404 }
      );
    }

    const initiator = handshake.initiator as any;
    const recipient = handshake.recipient as any;

    // Build a rich prompt using all available profile data
    const formatProfile = (p: any, label: string) => {
      const parts = [`**${label}:**`];
      if (p.hook) parts.push(`Hook: ${p.hook}`);
      if (p.role) parts.push(`Role: ${p.role}`);
      if (p.mission) parts.push(`Mission: ${p.mission}`);
      if (p.looking_for) parts.push(`Looking for: ${p.looking_for}`);

      // Add working style if available
      if (p.working_style?.core_dimensions) {
        const dims = p.working_style.core_dimensions;
        parts.push(`Working Style:`);
        if (dims.sync_async) parts.push(`  - Sync↔Async: ${dims.sync_async.score}/100`);
        if (dims.fast_ship_high_polish) parts.push(`  - Ship↔Polish: ${dims.fast_ship_high_polish.score}/100`);
        if (dims.solo_multiplier) parts.push(`  - Solo↔Multiplier: ${dims.solo_multiplier.score}/100`);
        if (dims.builder_strategist) parts.push(`  - Builder↔Strategist: ${dims.builder_strategist.score}/100`);
      }
      if (p.working_style?.vibe) parts.push(`Vibe: ${p.working_style.vibe}`);

      // Add collaboration fit
      if (p.collaboration_fit) {
        const cf = p.collaboration_fit;
        if (cf.availability) parts.push(`Availability: ${cf.availability}`);
        if (cf.stage) parts.push(`Stage: ${cf.stage}`);
        if (cf.work_best_with?.length) parts.push(`Works best with: ${cf.work_best_with.join(', ')}`);
        if (cf.what_i_bring?.length) parts.push(`Brings: ${cf.what_i_bring.join(', ')}`);
      }

      // Add proof points
      if (p.proof_points?.length) {
        parts.push(`Proof points:`);
        p.proof_points.slice(0, 3).forEach((pp: any) => {
          parts.push(`  - ${pp.name}: ${pp.description || pp.detail || ''}`);
        });
      }

      return parts.join('\n');
    };

    // Call Claude for Stage 1 analysis
    const analysisPrompt = `Analyze these two collaboration profiles and generate a Stage 1 analysis.

${formatProfile(initiator, 'Person A')}

${formatProfile(recipient, 'Person B')}

Generate:
1. Overlap areas (shared interests, skills, goals)
2. Working style compatibility preview (based on their scores)
3. 3-5 conversation starters that reference their specific profiles

Return ONLY valid JSON:

\`\`\`json
{
  "overlap": [
    {
      "category": "Shared Interest/Skill/Goal",
      "items": ["specific item 1", "specific item 2"],
      "why_matters": "Why this overlap could lead to collaboration"
    }
  ],
  "working_style_preview": [
    {
      "dimension": "Sync vs Async",
      "alignment": "aligned|complementary|friction",
      "insight": "Brief observation about compatibility"
    }
  ],
  "conversation_starters": [
    "Specific question referencing their actual profiles"
  ],
  "hook_alignment": "1-2 sentences on how their missions/hooks connect"
}
\`\`\``;

    const message = await anthropic.messages.create({
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

    // Update analysis in database with new fields
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        overlap: analysis.overlap,
        conversation_starters: analysis.conversation_starters,
        working_style_preview: analysis.working_style_preview || null,
        hook_alignment: analysis.hook_alignment || null,
        analysis_status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('handshake_id', handshakeId)
      .eq('stage', 1);

    if (updateError) {
      console.error('Failed to update analysis:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Update handshake status - Stage 1 complete, ready for viewing
    await supabase
      .from('handshakes')
      .update({ status: 'stage1_complete' })
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
