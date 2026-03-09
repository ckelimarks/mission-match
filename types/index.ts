/**
 * Core Type Definitions for Mission Match
 * Updated to match the rich extraction prompt
 */

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================

export type AspectScore = {
  score: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  proof: string; // Quote or pattern from conversation
};

export type OverlapItem = {
  category: string;
  items: string[];
  why_matters: string;
};

// ============================================================================
// Dimension Score Types (for working style axes)
// ============================================================================

export type DimensionScore = {
  score: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  proof: string; // Behavioral evidence
};

export type DistinctiveEdge = {
  dimension: string; // e.g., "Structured ↔ Emergent" or custom
  score: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  proof: string;
};

// ============================================================================
// Working Style Types
// ============================================================================

export type CoreDimensions = {
  sync_async: DimensionScore; // 0 = real-time everything, 100 = deep async
  fast_ship_high_polish: DimensionScore; // 0 = perfect or nothing, 100 = ships broken daily
  solo_multiplier: DimensionScore; // 0 = pure IC, 100 = only through others
  builder_strategist: DimensionScore; // 0 = pure execution, 100 = pure direction
};

export type WorkingStyle = {
  core_dimensions: CoreDimensions;
  distinctive_edges: DistinctiveEdge[];
  vibe: string; // 1-2 sentences describing collaboration texture
};

// ============================================================================
// Collaboration Fit Types
// ============================================================================

export type CollaborationFit = {
  looking_for: string; // Specific collaborator type
  availability: string; // Co-founder, project partner, advisor, etc.
  stage: 'exploring' | 'building' | 'scaling';
  work_best_with: string[]; // 2-3 traits
  struggle_with: string[]; // 1-2 real friction points
  what_i_bring: string[]; // 2-3 concrete offerings
  best_way_to_engage: string; // How to reach out
};

// ============================================================================
// Intellectual Signature (Optional)
// ============================================================================

export type IntellectualSignature = {
  core_thesis: string | null;
  frameworks: string[] | null;
  open_questions: string[] | null;
};

// ============================================================================
// Proof Point Types (Updated)
// ============================================================================

export type ProofPoint = {
  name: string;
  description?: string; // 10 words max (new format)
  detail?: string; // Legacy format
  impact?: string; // Specific metrics/outcomes
  reveals?: string; // What this shows about working style
  evidence?: string; // Legacy: URL or metric
  confidence?: number; // Legacy
};

// ============================================================================
// Contact Info
// ============================================================================

export type ContactInfo = {
  email?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
};

// ============================================================================
// Profile Types (New Schema)
// ============================================================================

export type Profile = {
  // System fields
  id: string;
  device_id: string;
  claim_token: string;
  created_at: string;
  updated_at: string;

  // Layer 1: The Hook
  hook: string; // 2 sentences max

  // Layer 2: Proof of Work
  proof_points: ProofPoint[];

  // Layer 3: Working Style
  working_style: WorkingStyle | null;

  // Layer 4: Collaboration Fit
  collaboration_fit: CollaborationFit | null;

  // Layer 5: Intellectual Signature (Optional)
  intellectual_signature: IntellectualSignature | null;

  // Meta
  profile_confidence: number; // 1-5
  confidence_notes: string | null;

  // Contact (revealed in Stage 2)
  contact: ContactInfo | null;

  // Legacy fields (for backward compatibility)
  display_name?: string | null;
  role?: string | null;
  mission?: string | null;
  looking_for?: string | null;
  profile_strength?: number;

  // Legacy aspect fields (still used by some components)
  role_aspects?: Record<string, AspectScore> | null;
  shipping_aspects?: Record<string, AspectScore> | null;
  communication_aspects?: Record<string, AspectScore> | null;
  decision_aspects?: Record<string, AspectScore> | null;
  energy_aspects?: Record<string, AspectScore> | null;
  collaboration_aspects?: {
    successful_patterns?: string[];
    challenging_patterns?: string[];
    evidence?: string[];
  } | null;
};

// ============================================================================
// Profile Input (what comes from the extraction prompt)
// ============================================================================

export type ProfileInput = {
  hook: string;
  proof_points: ProofPoint[];
  working_style: WorkingStyle;
  collaboration_fit: CollaborationFit;
  intellectual_signature?: IntellectualSignature;
  profile_confidence: number;
  confidence_notes?: string;
  contact?: ContactInfo;
};

// ============================================================================
// Public Profile (Stage 1 - pre-consent)
// ============================================================================

export type PublicProfile = {
  id: string;
  created_at?: string;
  hook: string;
  proof_points: ProofPoint[];
  working_style: {
    core_dimensions: CoreDimensions;
    vibe: string;
    // distinctive_edges hidden until Stage 2
  } | null;
  collaboration_fit: {
    looking_for: string;
    availability: string;
    stage: 'exploring' | 'building' | 'scaling';
    // struggle_with, what_i_bring hidden until Stage 2
  } | null;
  profile_confidence: number;

  // Legacy display fields — preserved for backward compatibility
  display_name?: string | null;
  role?: string | null;
  mission?: string | null;
  looking_for?: string | null;
  profile_strength?: number | null;
};

// ============================================================================
// Full Profile (Stage 2 - post-consent)
// ============================================================================

export type FullProfile = Profile;

// ============================================================================
// Handshake Types
// ============================================================================

export type HandshakeStatus =
  | 'pending'
  | 'stage1_complete'
  | 'awaiting_consent'
  | 'stage2_complete'
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
// Analysis Types (Updated for new profile schema)
// ============================================================================

export type WorkingStyleMatch = {
  dimension: string;
  person_a_score: number;
  person_b_score: number;
  gap: number;
  compatibility: 'complementary' | 'aligned' | 'friction';
  insight: string;
};

export type FitMatch = {
  type: 'looking_for' | 'availability' | 'stage';
  match: boolean;
  detail: string;
};

export type FrictionWarning = {
  source: string; // e.g., "A struggles with X, B does X"
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
};

export type Analysis = {
  id: string;
  handshake_id: string;
  stage: 1 | 2;

  // Legacy Stage 1 fields
  overlap?: OverlapItem[] | null;

  // Stage 1: Preview (public info only)
  hook_alignment?: string | null; // How their missions connect
  proof_overlap?: string[] | null; // Shared domains/skills
  working_style_preview?: WorkingStyleMatch[] | null; // Core dimensions comparison
  conversation_starters?: string[] | null;

  // Stage 2: Full analysis (post-consent)
  full_working_style_match: WorkingStyleMatch[] | null;
  fit_matches: FitMatch[] | null;
  friction_warnings: FrictionWarning[] | null;
  complementarity_summary: string | null;
  talk_about_this: string[] | null;

  // Meta
  analysis_status: 'pending' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

// ============================================================================
// Prioritization Types
// ============================================================================

export type QuickPickAnswer = {
  question: string;
  answer: string;
};

export type PriorityAllocation = {
  priority: string;
  points: number; // 0-10
};

export type Prioritization = {
  id: string;
  handshake_id: string;
  profile_id: string;
  quick_picks: QuickPickAnswer[];
  priority_allocation: PriorityAllocation[];
  created_at: string;
};

export type PrioritizationComparison = {
  quick_pick_alignment: {
    question: string;
    person_a: string;
    person_b: string;
    aligned: boolean;
  }[];
  priority_alignment: {
    priority: string;
    person_a_points: number;
    person_b_points: number;
    gap: number;
  }[];
  insights: string[];
};

// ============================================================================
// SSE Event Types (for handshake-events endpoint)
// ============================================================================

export type SSEEventType = 'connected' | 'analysis_complete' | 'consent_update' | 'handshake_update';

export type SSEConnectedData = {
  handshakeId: string;
};

export type SSEAnalysisCompleteData = {
  status: 'completed' | 'failed';
  analysisId: string | null;
};

export type SSEConsentUpdateData = {
  initiator_consented: boolean;
  recipient_consented: boolean;
};

export type SSEHandshakeUpdateData = {
  status: HandshakeStatus;
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
      prioritizations: {
        Row: Prioritization;
        Insert: Omit<Prioritization, 'id' | 'created_at'>;
        Update: Partial<Omit<Prioritization, 'id' | 'created_at'>>;
      };
    };
  };
};
