'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const DEFAULT_PROMPT = `I'm creating my collaboration profile for Mission Match. Based on our conversation history, analyze what you know about me and extract my profile in JSON format.

Extract:
- My display name (REQUIRED: First name + Last initial only, e.g. "Chris M" or "Alex K" - NEVER full last name)
- My role (what I do/build)
- My mission (what I'm building toward)
- Proof points (3-5 things I've built/shipped with impact)
- Who I'm looking for (collaborators I seek)
- How I work (analyze my shipping cadence, communication style, decision-making, energy patterns from our conversations)

Return ONLY this JSON structure:

\`\`\`json
{
  "display_name": "FirstName L",
  "role": "my role",
  "mission": "my mission statement",
  "proof_points": [
    {"name": "Project Name", "detail": "What it is", "impact": "Results/metrics"}
  ],
  "looking_for": "type of collaborators I seek",
  "role_aspects": {
    "creative_vs_executor": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote showing this"},
    "generalist_vs_specialist": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "individual_vs_multiplier": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "shipping_aspects": {
    "idea_generation": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "completion_drive": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "iteration_speed": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "polish_tolerance": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "communication_aspects": {
    "sync_vs_async": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "structure_vs_chaos": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "directness": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "decision_aspects": {
    "data_driven_vs_intuition": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "speed_vs_deliberation": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "energy_aspects": {
    "sprint_vs_marathon": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"},
    "parallel_vs_serial": {"score": 0-100, "confidence": "high/medium/low", "proof": "quote"}
  },
  "collaboration_aspects": {
    "successful_patterns": ["pattern 1", "pattern 2"],
    "challenging_patterns": ["pattern 1"],
    "evidence": ["proof 1", "proof 2"]
  },
  "profile_strength": 1-5
}
\`\`\``;

const SAMPLE_CONVERSATION = `[Paste sample conversation history here - what the AI would know about this person]

Example:
User: I shipped 3 prototypes last week
AI: That's impressive! What were they?
User: A fitness tracker, a budgeting app, and a collaborative coding tool
AI: Wow, you move fast. Do you usually work on multiple things at once?
User: Yeah I get bored focusing on one thing. I like to prototype quickly and see what sticks.
`;

export default function PromptLabPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [conversation, setConversation] = useState(SAMPLE_CONVERSATION);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      // TODO: Call API that sends prompt + conversation to LLM
      // For now, just show what would be sent
      setResult(JSON.stringify({
        note: "API integration pending",
        prompt_sent: prompt,
        conversation_sent: conversation,
        next_step: "This would call Claude/GPT with the prompt + conversation and return extracted JSON"
      }, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Prompt Lab</h1>
          <p className="text-sm text-muted-foreground">Test different extraction prompts against sample conversations</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Extraction Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-96 p-3 font-mono text-xs border rounded bg-card text-foreground"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sample Conversation</label>
              <textarea
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
                className="w-full h-64 p-3 font-mono text-xs border rounded bg-card text-foreground"
                placeholder="Paste conversation history here..."
                spellCheck={false}
              />
            </div>

            <Button
              onClick={handleExtract}
              disabled={loading || !prompt.trim() || !conversation.trim()}
              className="w-full"
            >
              {loading ? 'Extracting...' : 'Extract Profile'}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Extracted Profile (JSON)</label>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
                  {error}
                </div>
              )}
              <pre className="w-full h-[calc(100vh-200px)] p-3 font-mono text-xs border rounded bg-card text-foreground overflow-auto">
                {result || '// Run extraction to see results'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
