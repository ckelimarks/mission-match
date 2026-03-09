/**
 * Profile visibility enforcement for two-stage consent model.
 *
 * Stage 1 (pre-consent): Public view — redact sensitive fields
 * Stage 2 (post-consent): Full view — all fields revealed
 */

import type { PublicProfile, Profile } from '@/types';

/**
 * Strip a profile down to Stage 1 public fields.
 * Removes: distinctive_edges, struggle_with, what_i_bring, best_way_to_engage,
 * contact info, intellectual_signature, and sensitive collaboration details.
 */
export function toPublicProfile(profile: Record<string, any>): PublicProfile {
  return {
    id: profile.id,
    hook: profile.hook || profile.role || '',
    proof_points: profile.proof_points || [],
    working_style: profile.working_style || profile.role_aspects
      ? {
          core_dimensions: (profile.working_style || profile.role_aspects)?.core_dimensions || null,
          vibe: (profile.working_style || profile.role_aspects)?.vibe || '',
          // distinctive_edges intentionally omitted
        }
      : null,
    collaboration_fit: profile.collaboration_fit || profile.collaboration_aspects
      ? {
          looking_for: (profile.collaboration_fit || profile.collaboration_aspects)?.looking_for || '',
          availability: (profile.collaboration_fit || profile.collaboration_aspects)?.availability || '',
          stage: (profile.collaboration_fit || profile.collaboration_aspects)?.stage || 'exploring',
          // struggle_with, what_i_bring, work_best_with, best_way_to_engage intentionally omitted
        }
      : null,
    profile_confidence: profile.profile_confidence || profile.profile_strength || 3,
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
