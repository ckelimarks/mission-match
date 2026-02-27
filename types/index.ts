/**
 * Core Type Definitions for Mission Match
 * Includes aspect-level behavioral model
 */

// ============================================================================
// Aspect Model Types
// ============================================================================

export type AspectScore = {
  score: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  proof: string; // Quote or pattern from conversation
};

export type RoleAspects = {
  creative_vs_executor: AspectScore;
  generalist_vs_specialist: AspectScore;
  individual_vs_multiplier: AspectScore;
};

export type ShippingAspects = {
  idea_generation: AspectScore;
  completion_drive: AspectScore;
  iteration_speed: AspectScore;
  polish_tolerance: AspectScore;
};

export type CommunicationAspects = {
  sync_vs_async: AspectScore;
  structure_vs_chaos: AspectScore;
  directness: AspectScore;
};

export type DecisionAspects = {
  data_driven_vs_intuition: AspectScore;
  speed_vs_deliberation: AspectScore;
};

export type EnergyAspects = {
  sprint_vs_marathon: AspectScore;
  parallel_vs_serial: AspectScore;
};

export type CollaborationHistory = {
  successful_patterns: string[];
  challenging_patterns: string[];
  evidence: string[];
};

// ============================================================================
// Proof Point Types
// ============================================================================

export type ProofPoint = {
  name: string;
  detail: string;
  impact?: string;
  evidence?: string; // URL or metric
  confidence?: number;
};

// ============================================================================
// Profile Types
// ============================================================================

export type Profile = {
  id: string;
  device_id: string;
  display_name: string | null;
  role: string | null;
  mission: string | null;
  proof_points: ProofPoint[];
  looking_for: string | null;

  // Aspect-level behavioral data
  role_aspects: RoleAspects | null;
  shipping_aspects: ShippingAspects | null;
  communication_aspects: CommunicationAspects | null;
  decision_aspects: DecisionAspects | null;
  energy_aspects: EnergyAspects | null;
  collaboration_aspects: CollaborationHistory | null;

  ai_conversation_file_url: string | null;
  profile_strength: number; // 1-5
  created_at: string;
  updated_at: string;
};

// Public profile (Stage 1 - pre-consent)
export type PublicProfile = Pick<Profile,
  | 'id'
  | 'display_name'
  | 'role'
  | 'mission'
  | 'looking_for'
  | 'profile_strength'
>;

// Full profile (Stage 2 - post-consent)
export type FullProfile = Profile;

// ============================================================================
// Handshake Types
// ============================================================================

export type HandshakeStatus =
  | 'pending'
  | 'awaiting_consent'
  | 'approved'
  | 'declined';

export type Handshake = {
  id: string;
  initiator_id: string;
  recipient_id: string;
  status: HandshakeStatus;
  initiator_consented: boolean;
  recipient_consented: boolean;
  mutual_consent_token: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// Analysis Types
// ============================================================================

export type OverlapItem = {
  category: string;
  items: string[];
  why_matters: string;
};

export type AspectMismatch = {
  axis: string;
  aspect_name: string;
  person_a_score: number;
  person_b_score: number;
  gap: number;
  interpretation: string;
};

export type PairingRisk = {
  risk_type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
};

export type Analysis = {
  id: string;
  handshake_id: string;
  stage: 1 | 2;

  // Stage 1: Overlap analysis (anonymized)
  overlap: OverlapItem[] | null;
  conversation_starters: string[] | null;

  // Stage 2: Full analysis (post-consent)
  complementarity_score: number | null;
  aspect_mismatches: AspectMismatch[] | null;
  pairing_risks: PairingRisk[] | null;
  talk_about_this: string[] | null;

  analysis_status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

// ============================================================================
// Database Type (for Supabase client typing)
// ============================================================================

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      handshakes: {
        Row: Handshake;
        Insert: Omit<Handshake, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Handshake, 'id' | 'created_at' | 'updated_at'>>;
      };
      analyses: {
        Row: Analysis;
        Insert: Omit<Analysis, 'id' | 'created_at'>;
        Update: Partial<Omit<Analysis, 'id' | 'created_at'>>;
      };
    };
  };
};
