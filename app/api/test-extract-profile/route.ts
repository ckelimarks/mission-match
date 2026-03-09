import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, conversation } = await request.json();

    if (!prompt || !conversation) {
      return NextResponse.json(
        { error: 'prompt and conversation are required' },
        { status: 400 }
      );
    }

    console.log('[TEST-EXTRACT] Calling Claude with prompt...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nConversation history:\n${conversation}`,
        },
      ],
    });

    const response = message.content[0];
    const text = response.type === 'text' ? response.text : '';

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    try {
      const extractedProfile = JSON.parse(jsonText);
      console.log('[TEST-EXTRACT] Successfully extracted profile');

      return NextResponse.json({
        success: true,
        profile: extractedProfile,
        raw_response: text,
      });
    } catch (parseErr) {
      console.error('[TEST-EXTRACT] Failed to parse JSON:', parseErr);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse JSON from Claude response',
        raw_response: text,
      });
    }
  } catch (error) {
    console.error('[TEST-EXTRACT] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
