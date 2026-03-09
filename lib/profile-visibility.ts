/**
 * Profile visibility enforcement for two-stage consent model.
 *
 * Stage 1 (pre-consent): Public view — redact sensitive fields
 * Stage 2 (post-consent): Full view — all fields revealed
 *
 * Public profiles preserve legacy display fields (display_name, role, mission,
 * looking_for) since they're used across the app for basic rendering.
 */

/**
 * Strip a profile down to Stage 1 public fields.
 * Removes: distinctive_edges, struggle_with, what_i_bring, best_way_to_engage,
 * contact info, intellectual_signature, energy/decision/shipping aspects,
 * and sensitive collaboration details.
 *
 * Preserves: legacy display fields, hook, proof_points, core working style
 * dimensions, basic collaboration fit, profile_confidence.
 */
export function toPublicProfile(profile: Record<string, any>): Record<string, any> {
  const workingStyleSource = profile.working_style || profile.role_aspects;
  const collabSource = profile.collaboration_fit || profile.collaboration_aspects;

  return {
    id: profile.id,
    created_at: profile.created_at,

    // Legacy display fields — used everywhere for names/labels
    display_name: profile.display_name ?? null,
    role: profile.role ?? null,
    mission: profile.mission ?? null,
    looking_for: profile.looking_for ?? null,
    profile_strength: profile.profile_strength ?? null,

    // New schema public fields
    hook: profile.hook || profile.role || '',
    proof_points: profile.proof_points || [],
    working_style: workingStyleSource
      ? {
          core_dimensions: workingStyleSource.core_dimensions || null,
          vibe: workingStyleSource.vibe || '',
          // distinctive_edges intentionally omitted
        }
      : null,
    collaboration_fit: collabSource
      ? {
          looking_for: collabSource.looking_for || '',
          availability: collabSource.availability || '',
          stage: collabSource.stage || 'exploring',
          // struggle_with, what_i_bring, work_best_with, best_way_to_engage omitted
        }
      : null,
    profile_confidence: profile.profile_confidence || profile.profile_strength || 3,

    // Omitted in Stage 1:
    // - collaboration_aspects (deep patterns)
    // - communication_aspects (contact info lives here)
    // - decision_aspects, energy_aspects, shipping_aspects
    // - intellectual_signature
    // - distinctive_edges (from working_style)
  };
}

/**
 * Return full profile (Stage 2 — all fields).
 */
export function toFullProfile(profile: Record<string, any>): Record<string, any> {
  return profile;
}

/**
 * Parse JSON string fields that Supabase may return as strings.
 */
export function parseProfileJsonFields(profile: Record<string, any>): Record<string, any> {
  const jsonFields = [
    'proof_points', 'role_aspects', 'shipping_aspects',
    'communication_aspects', 'decision_aspects', 'energy_aspects',
    'collaboration_aspects', 'working_style',
  ];

  const parsed = { ...profile };
  for (const field of jsonFields) {
    if (typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch {
        // Leave as-is if parsing fails
      }
    }
  }
  return parsed;
}
