import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ProfileInput } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Robust JSON repair for common AI output issues
function repairJson(input: string): string {
  let text = input;
  console.log('[REPAIR] Input length:', input.length);
  console.log('[REPAIR] First 200 chars:', input.substring(0, 200));

  // Step 1: Remove code block wrappers
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    text = jsonMatch[1];
    console.log('[REPAIR] Removed code block wrapper');
  }

  // Step 2: Replace smart quotes and special characters
  text = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // Smart double quotes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // Smart single quotes
    .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes
    .replace(/\u2026/g, '...')  // Ellipsis
    .replace(/[\u00A0]/g, ' ')  // Non-breaking space
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n');

  // Step 3: REMOVED - was incorrectly modifying already-valid JSON
  // The line-by-line Step 4 handles the missing quote case correctly

  // Step 4: More aggressive fix - find lines with "key": unquotedValue" pattern (missing opening quote)
  const lines = text.split('\n');
  console.log('[REPAIR] Processing', lines.length, 'lines');
  const fixedLines = lines.map((line, idx) => {
    // Match "key": SomeValue" where the opening quote is missing but closing exists
    const missingOpenQuote = line.match(/^(\s*"[^"]+"\s*:\s*)([A-Za-z][^"]*)(")(\s*,?\s*)$/);
    if (missingOpenQuote) {
      const [, keyPart, valuePart, closeQuote, ending] = missingOpenQuote;
      const fixed = `${keyPart}"${valuePart}${closeQuote}${ending}`;
      console.log('[REPAIR] Line', idx, 'FIXED missing open quote:', fixed.substring(0, 80));
      return fixed;
    }

    // Match "key": followed by completely unquoted value (no quotes at all)
    const fullyUnquoted = line.match(/^(\s*"[^"]+"\s*:\s*)([A-Za-z][^,}\]"]*)(,?\s*)$/);
    if (fullyUnquoted) {
      const [, keyPart, valuePart, ending] = fullyUnquoted;
      const trimmedValue = valuePart.trim();
      // Don't quote boolean/null keywords
      if (!['true', 'false', 'null'].includes(trimmedValue)) {
        const fixed = `${keyPart}"${trimmedValue}"${ending}`;
        console.log('[REPAIR] Line', idx, 'FIXED fully unquoted:', fixed.substring(0, 80));
        return fixed;
      }
    }

    return line;
  });
  text = fixedLines.join('\n');

  // Step 5: Remove trailing commas before } or ]
  text = text.replace(/,(\s*[}\]])/g, '$1');

  // Step 6: Ensure proper escaping of quotes inside strings
  // This is tricky - we need to find unescaped quotes inside string values
  // For now, just trim whitespace
  text = text.trim();

  return text;
}

// Try multiple parse strategies
function parseJsonRobust(input: string): any {
  const repaired = repairJson(input);

  // Try 1: Direct parse
  try {
    return JSON.parse(repaired);
  } catch (e1) {
    console.log('Direct parse failed, trying line-by-line repair...');
  }

  // Try 2: Even more aggressive line-by-line repair
  let text = repaired;
  const lines = text.split('\n');
  const repairedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Fix unquoted string values more aggressively
    // Look for pattern: "key": SomeValue" (missing opening quote)
    const unquotedMatch = line.match(/^(\s*"[^"]+"\s*:\s*)([A-Za-z][^"]*)(")(\s*,?\s*)$/);
    if (unquotedMatch) {
      const [, prefix, value, closeQuote, suffix] = unquotedMatch;
      line = `${prefix}"${value}${closeQuote}${suffix}`;
    }

    repairedLines.push(line);
  }

  text = repairedLines.join('\n');

  try {
    return JSON.parse(text);
  } catch (e2) {
    console.log('Line-by-line repair failed');
    console.log('Final text (first 1000 chars):', text.substring(0, 1000));
    throw e2;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept either { profileData: ... } or direct profile input
    // Also handle raw JSON string in profileData
    let profileData = body.profileData || body;

    // If profileData is a string, repair and parse it
    if (typeof profileData === 'string') {
      try {
        console.log('Raw input length:', profileData.length);
        profileData = parseJsonRobust(profileData);
        console.log('Successfully parsed profile');
      } catch (parseError) {
        console.error('JSON parse error after repair:', parseError);
        return NextResponse.json(
          {
            error: 'Could not parse profile JSON even after repair. Please try regenerating from your AI.',
            details: parseError instanceof Error ? parseError.message : 'Parse error',
          },
          { status: 400 }
        );
      }
    }

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    // Detect format: new (has 'hook') vs legacy (has 'role' and 'mission')
    const isNewFormat = 'hook' in profileData;

    // Validate based on format
    if (isNewFormat) {
      if (!profileData.hook) {
        return NextResponse.json(
          { error: 'Missing required field: hook' },
          { status: 400 }
        );
      }
    } else {
      // Legacy format validation
      if (!profileData.role || !profileData.mission) {
        return NextResponse.json(
          { error: 'Missing required fields: role and mission (or use new format with hook)' },
          { status: 400 }
        );
      }
    }

    // Generate device ID and claim token
    const deviceId = crypto.randomUUID();
    const claimToken = crypto.randomUUID();

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build insert data based on format
    let insertData: Record<string, unknown>;

    if (isNewFormat) {
      // New format from rich extraction prompt
      const input = profileData as ProfileInput;

      // Extract display name from the profile data
      const displayName = (input as ProfileInput & { display_name?: string | null }).display_name || null;

      // Create provenance metadata
      const provenance = {
        extracted_at: new Date().toISOString(),
        extraction_model: displayName ? 'claude-sonnet-4.5' : 'unknown', // Default to Claude if profile has data
        reviewed_by_human: true, // User submitted this, so they reviewed it
        version: 1,
        handshake_count: 0, // Track successful handshakes
        consent_rate: 0.0, // Calculate after handshakes
      };

      // Map new format to database columns
      // Using existing JSONB columns for new structured data
      insertData = {
        device_id: deviceId,
        claim_token: claimToken,
        display_name: displayName,

        // Store hook in role field (repurposed)
        role: input.hook,

        // Store collaboration fit summary in mission
        mission: input.collaboration_fit?.looking_for || null,

        // Store proof points
        proof_points: input.proof_points || [],

        // Store looking_for from collaboration fit
        looking_for: input.collaboration_fit?.best_way_to_engage || null,

        // Store working style in role_aspects (repurposed JSONB)
        role_aspects: input.working_style || null,

        // Store collaboration fit in collaboration_aspects (repurposed JSONB)
        collaboration_aspects: input.collaboration_fit || null,

        // Store intellectual signature in shipping_aspects (repurposed JSONB)
        shipping_aspects: input.intellectual_signature || null,

        // Store contact info in communication_aspects (repurposed JSONB)
        communication_aspects: input.contact || null,

        // Store confidence, notes, AND provenance in decision_aspects (repurposed JSONB)
        decision_aspects: {
          profile_confidence: input.profile_confidence || 3,
          confidence_notes: input.confidence_notes || null,
          provenance: provenance, // Add provenance metadata
        },

        // Calculate profile strength from confidence
        profile_strength: Math.min(5, Math.max(1, input.profile_confidence || 3)),
      };
    } else {
      // Legacy format
      insertData = {
        device_id: deviceId,
        claim_token: claimToken,
        display_name: profileData.display_name || null,
        role: profileData.role,
        mission: profileData.mission,
        proof_points: profileData.proof_points || [],
        looking_for: profileData.looking_for,
        role_aspects: profileData.role_aspects || null,
        shipping_aspects: profileData.shipping_aspects || null,
        communication_aspects: profileData.communication_aspects || null,
        decision_aspects: profileData.decision_aspects || null,
        energy_aspects: profileData.energy_aspects || null,
        collaboration_aspects: profileData.collaboration_aspects || null,
        profile_strength: profileData.profile_strength || 3,
      };
    }

    // Insert profile into Supabase
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save profile to database', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profileId: profile.id,
      deviceId,
      claimToken,
      profile,
      message: 'Profile created successfully',
    });
  } catch (error) {
    console.error('Save profile error:', error);

    return NextResponse.json(
      {
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
