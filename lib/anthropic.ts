/**
 * Anthropic Claude API Client
 * For AI extraction and analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ProofPoint } from '@/types';

// Lazy initialization to avoid build-time errors
let _anthropic: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

// For backwards compatibility - use as a proxy
export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop) {
    return (getAnthropic() as any)[prop];
  },
});

/**
 * Extract collaboration profile from conversation history
 */
export async function extractProfile(conversationText: string) {
  const message = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Analyze this conversation history and extract a professional collaboration profile with aspect-level behavioral insights.

Extract:

1. **Basic Profile**:
   - role: What do they do? (1-2 words, e.g., "Product Builder", "Designer")
   - mission: What are they building toward? (1 sentence)
   - proof_points: What have they built/shipped/achieved? (array of {name, detail, impact, evidence})
   - looking_for: What collaborators are they seeking? (1 sentence)

2. **Aspect-Level Behavioral Data** (score 0-100, confidence low/medium/high, proof as quote):

   **role_aspects**:
   - creative_vs_executor: Do they generate ideas or execute on them?
   - generalist_vs_specialist: Broad skills or deep expertise?
   - individual_vs_multiplier: Solo contributor or force multiplier?

   **shipping_aspects**:
   - idea_generation: Volume and frequency of new ideas
   - completion_drive: Finishing what they start
   - iteration_speed: Fast feedback incorporation
   - polish_tolerance: Comfort shipping rough edges

   **communication_aspects**:
   - sync_vs_async: Preference for real-time vs asynchronous communication
   - structure_vs_chaos: Organized processes vs spontaneous flow
   - directness: Blunt feedback or diplomatic delivery

   **decision_aspects**:
   - data_driven_vs_intuition: Evidence-based or gut feeling
   - speed_vs_deliberation: Fast decisions or careful analysis

   **energy_aspects**:
   - sprint_vs_marathon: Intense bursts or steady pace
   - parallel_vs_serial: Multiple projects or one at a time

   **collaboration_aspects**:
   - successful_patterns: What collaboration styles have worked? (array of strings)
   - challenging_patterns: What patterns have been difficult? (array of strings)
   - evidence: Proof points for these patterns (array of strings)

3. **Profile Strength** (1-5 based on conversation richness):
   - 5: Rich conversation history with detailed projects and outcomes
   - 4: Good evidence with multiple examples
   - 3: Moderate evidence, some patterns visible
   - 2: Limited data, basic profile only
   - 1: Very shallow, minimal information

Return ONLY valid JSON in this exact structure:

\`\`\`json
{
  "role": "string",
  "mission": "string",
  "proof_points": [
    {"name": "string", "detail": "string", "impact": "string", "evidence": "url or metric"}
  ],
  "looking_for": "string",
  "role_aspects": {
    "creative_vs_executor": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "generalist_vs_specialist": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "individual_vs_multiplier": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"}
  },
  "shipping_aspects": {
    "idea_generation": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "completion_drive": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "iteration_speed": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "polish_tolerance": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"}
  },
  "communication_aspects": {
    "sync_vs_async": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "structure_vs_chaos": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "directness": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"}
  },
  "decision_aspects": {
    "data_driven_vs_intuition": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "speed_vs_deliberation": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"}
  },
  "energy_aspects": {
    "sprint_vs_marathon": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"},
    "parallel_vs_serial": {"score": 0-100, "confidence": "low|medium|high", "proof": "quote"}
  },
  "collaboration_aspects": {
    "successful_patterns": ["string", "string"],
    "challenging_patterns": ["string", "string"],
    "evidence": ["string", "string"]
  },
  "profile_strength": 1-5
}
\`\`\`

Conversation history:

${conversationText}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response (handle code blocks)
  const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/) ||
                    content.text.match(/```\n([\s\S]*?)\n```/);

  const jsonText = jsonMatch ? jsonMatch[1] : content.text;
  return JSON.parse(jsonText);
}

/**
 * Calculate simple confidence score based on proof points
 */
export function calculateConfidence(proofPoints: ProofPoint[]): number {
  if (!proofPoints || proofPoints.length === 0) return 0.2;
  if (proofPoints.some(p => p.evidence?.startsWith('http'))) return 0.8;
  if (proofPoints.some(p => p.impact?.match(/\d+/))) return 0.6;
  return 0.4;
}
