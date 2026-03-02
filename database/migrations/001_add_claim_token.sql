-- Migration: Add claim_token for profile reclaim functionality
-- This allows users to reclaim their profile on new devices by scanning a QR code

-- Add claim_token column
ALTER TABLE profiles ADD COLUMN claim_token TEXT UNIQUE;

-- Generate claim tokens for existing profiles that don't have one
UPDATE profiles
SET claim_token = gen_random_uuid()::text
WHERE claim_token IS NULL;

-- Make claim_token NOT NULL after backfilling
ALTER TABLE profiles ALTER COLUMN claim_token SET NOT NULL;

-- Add default for new profiles
ALTER TABLE profiles ALTER COLUMN claim_token SET DEFAULT gen_random_uuid()::text;

-- Create index for fast claim token lookups
CREATE INDEX idx_profiles_claim_token ON profiles(claim_token);
