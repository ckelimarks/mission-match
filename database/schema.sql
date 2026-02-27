-- Mission Match Database Schema
-- Includes aspect-level behavioral model and RLS policies

-- ============================================================================
-- Enable UUID Extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Profiles Table
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT,
  mission TEXT,
  proof_points JSONB DEFAULT '[]'::jsonb,
  looking_for TEXT,

  -- Aspect-level behavioral data
  role_aspects JSONB,
  shipping_aspects JSONB,
  communication_aspects JSONB,
  decision_aspects JSONB,
  energy_aspects JSONB,
  collaboration_aspects JSONB,

  ai_conversation_file_url TEXT,
  profile_strength INTEGER DEFAULT 1 CHECK (profile_strength >= 1 AND profile_strength <= 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for device_id lookups
CREATE INDEX idx_profiles_device_id ON profiles(device_id);

-- ============================================================================
-- Handshakes Table
-- ============================================================================

CREATE TABLE handshakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_consent', 'approved', 'declined')),
  initiator_consented BOOLEAN DEFAULT FALSE,
  recipient_consented BOOLEAN DEFAULT FALSE,
  mutual_consent_token UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique handshakes between two people
  CONSTRAINT unique_handshake UNIQUE (initiator_id, recipient_id)
);

-- Indexes for handshake lookups
CREATE INDEX idx_handshakes_initiator ON handshakes(initiator_id);
CREATE INDEX idx_handshakes_recipient ON handshakes(recipient_id);
CREATE INDEX idx_handshakes_mutual_token ON handshakes(mutual_consent_token);

-- ============================================================================
-- Analyses Table
-- ============================================================================

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handshake_id UUID NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL CHECK (stage IN (1, 2)),

  -- Stage 1: Overlap analysis (anonymized, pre-consent)
  overlap JSONB,
  conversation_starters JSONB,

  -- Stage 2: Full analysis (post-consent)
  complementarity_score INTEGER CHECK (complementarity_score >= 0 AND complementarity_score <= 100),
  aspect_mismatches JSONB,
  pairing_risks JSONB,
  talk_about_this JSONB,

  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Ensure one analysis per stage per handshake
  CONSTRAINT unique_stage_per_handshake UNIQUE (handshake_id, stage)
);

-- Index for handshake lookups
CREATE INDEX idx_analyses_handshake ON analyses(handshake_id);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE handshakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read access to basic fields
CREATE POLICY "public_profile_read" ON profiles
  FOR SELECT
  USING (true);

-- Profiles: Full access for profile owner (based on device_id)
CREATE POLICY "profile_owner_full_access" ON profiles
  FOR ALL
  USING (device_id::text = current_setting('request.headers', true)::json->>'x-device-id');

-- Handshakes: Users can view handshakes they're involved in
CREATE POLICY "handshake_participant_read" ON handshakes
  FOR SELECT
  USING (
    initiator_id IN (SELECT id FROM profiles WHERE device_id::text = current_setting('request.headers', true)::json->>'x-device-id')
    OR recipient_id IN (SELECT id FROM profiles WHERE device_id::text = current_setting('request.headers', true)::json->>'x-device-id')
  );

-- Handshakes: Users can create handshakes where they're the initiator
CREATE POLICY "handshake_initiator_create" ON handshakes
  FOR INSERT
  WITH CHECK (
    initiator_id IN (SELECT id FROM profiles WHERE device_id::text = current_setting('request.headers', true)::json->>'x-device-id')
  );

-- Handshakes: Users can update handshakes they're involved in
CREATE POLICY "handshake_participant_update" ON handshakes
  FOR UPDATE
  USING (
    initiator_id IN (SELECT id FROM profiles WHERE device_id::text = current_setting('request.headers', true)::json->>'x-device-id')
    OR recipient_id IN (SELECT id FROM profiles WHERE device_id::text = current_setting('request.headers', true)::json->>'x-device-id')
  );

-- Analyses: Stage 1 analyses are publicly readable
CREATE POLICY "stage1_analysis_public_read" ON analyses
  FOR SELECT
  USING (stage = 1);

-- Analyses: Stage 2 analyses only readable by handshake participants
CREATE POLICY "stage2_analysis_participant_read" ON analyses
  FOR SELECT
  USING (
    stage = 2
    AND handshake_id IN (
      SELECT id FROM handshakes
      WHERE initiator_id IN (SELECT id FROM profiles WHERE device_id::text = current_setting('request.headers', true)::json->>'x-device-id')
         OR recipient_id IN (SELECT id FROM profiles WHERE device_id::text = current_setting('request.headers', true)::json->>'x-device-id')
    )
  );

-- ============================================================================
-- Functions
-- ============================================================================

-- Update updated_at timestamp on row updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate mutual consent token atomically (prevents race conditions)
CREATE OR REPLACE FUNCTION generate_consent_token(handshake_uuid UUID)
RETURNS UUID AS $$
DECLARE
  token UUID;
BEGIN
  UPDATE handshakes
  SET
    mutual_consent_token = uuid_generate_v4(),
    status = 'approved',
    updated_at = NOW()
  WHERE id = handshake_uuid
    AND status = 'awaiting_consent'
    AND initiator_consented = true
    AND recipient_consented = true
    AND mutual_consent_token IS NULL
  RETURNING mutual_consent_token INTO token;

  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER handshakes_updated_at
  BEFORE UPDATE ON handshakes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Seed Data (Optional - for testing)
-- ============================================================================

-- Uncomment below to add test data
/*
INSERT INTO profiles (device_id, display_name, role, mission, looking_for, profile_strength) VALUES
  (uuid_generate_v4(), 'Test User 1', 'Product Builder', 'Building tools for developers', 'Technical co-founder', 3),
  (uuid_generate_v4(), 'Test User 2', 'Designer', 'Creating delightful experiences', 'Product collaborator', 4);
*/
