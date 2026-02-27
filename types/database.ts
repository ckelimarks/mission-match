/**
 * Supabase Database Type Definitions
 * Auto-generated types based on the database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          device_id: string;
          display_name: string | null;
          role: string | null;
          mission: string | null;
          proof_points: Json;
          looking_for: string | null;
          role_aspects: Json | null;
          shipping_aspects: Json | null;
          communication_aspects: Json | null;
          decision_aspects: Json | null;
          energy_aspects: Json | null;
          collaboration_aspects: Json | null;
          ai_conversation_file_url: string | null;
          profile_strength: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          display_name?: string | null;
          role?: string | null;
          mission?: string | null;
          proof_points?: Json;
          looking_for?: string | null;
          role_aspects?: Json | null;
          shipping_aspects?: Json | null;
          communication_aspects?: Json | null;
          decision_aspects?: Json | null;
          energy_aspects?: Json | null;
          collaboration_aspects?: Json | null;
          ai_conversation_file_url?: string | null;
          profile_strength?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          display_name?: string | null;
          role?: string | null;
          mission?: string | null;
          proof_points?: Json;
          looking_for?: string | null;
          role_aspects?: Json | null;
          shipping_aspects?: Json | null;
          communication_aspects?: Json | null;
          decision_aspects?: Json | null;
          energy_aspects?: Json | null;
          collaboration_aspects?: Json | null;
          ai_conversation_file_url?: string | null;
          profile_strength?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      handshakes: {
        Row: {
          id: string;
          initiator_id: string;
          recipient_id: string;
          status: string;
          initiator_consented: boolean;
          recipient_consented: boolean;
          mutual_consent_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          initiator_id: string;
          recipient_id: string;
          status?: string;
          initiator_consented?: boolean;
          recipient_consented?: boolean;
          mutual_consent_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          initiator_id?: string;
          recipient_id?: string;
          status?: string;
          initiator_consented?: boolean;
          recipient_consented?: boolean;
          mutual_consent_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      analyses: {
        Row: {
          id: string;
          handshake_id: string;
          stage: number;
          overlap: Json | null;
          conversation_starters: Json | null;
          complementarity_score: number | null;
          aspect_mismatches: Json | null;
          pairing_risks: Json | null;
          talk_about_this: Json | null;
          analysis_status: string;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          handshake_id: string;
          stage: number;
          overlap?: Json | null;
          conversation_starters?: Json | null;
          complementarity_score?: number | null;
          aspect_mismatches?: Json | null;
          pairing_risks?: Json | null;
          talk_about_this?: Json | null;
          analysis_status?: string;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          handshake_id?: string;
          stage?: number;
          overlap?: Json | null;
          conversation_starters?: Json | null;
          complementarity_score?: number | null;
          aspect_mismatches?: Json | null;
          pairing_risks?: Json | null;
          talk_about_this?: Json | null;
          analysis_status?: string;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
    };
  };
}
