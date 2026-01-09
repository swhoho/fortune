/**
 * Supabase 데이터베이스 타입 정의
 * 자동 생성됨 - 수동 수정 금지
 *
 * 재생성: Supabase MCP > generate_typescript_types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          created_at: string | null;
          credits_used: number;
          feature_type: string;
          id: string;
          input_tokens: number;
          metadata: Json | null;
          model: string;
          output_tokens: number;
          profile_id: string | null;
          report_id: string | null;
          total_tokens: number | null;
          user_id: string;
          cost_usd: number | null;
        };
        Insert: {
          created_at?: string | null;
          credits_used?: number;
          feature_type: string;
          id?: string;
          input_tokens?: number;
          metadata?: Json | null;
          model?: string;
          output_tokens?: number;
          profile_id?: string | null;
          report_id?: string | null;
          user_id: string;
          cost_usd?: number | null;
        };
        Update: {
          created_at?: string | null;
          credits_used?: number;
          feature_type?: string;
          id?: string;
          input_tokens?: number;
          metadata?: Json | null;
          model?: string;
          output_tokens?: number;
          profile_id?: string | null;
          report_id?: string | null;
          user_id?: string;
          cost_usd?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_usage_logs_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_usage_logs_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'profile_reports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_usage_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_reports: {
        Row: {
          analysis: Json | null;
          created_at: string | null;
          credits_used: number | null;
          current_step: string | null;
          daewun: Json | null;
          error: Json | null;
          estimated_time_remaining: number | null;
          id: string;
          jijanggan: Json | null;
          pillars: Json | null;
          profile_id: string;
          progress_percent: number | null;
          scores: Json | null;
          status: string;
          step_statuses: Json | null;
          updated_at: string | null;
          user_id: string;
          visualization_url: string | null;
        };
        Insert: {
          analysis?: Json | null;
          created_at?: string | null;
          credits_used?: number | null;
          current_step?: string | null;
          daewun?: Json | null;
          error?: Json | null;
          estimated_time_remaining?: number | null;
          id?: string;
          jijanggan?: Json | null;
          pillars?: Json | null;
          profile_id: string;
          progress_percent?: number | null;
          scores?: Json | null;
          status?: string;
          step_statuses?: Json | null;
          updated_at?: string | null;
          user_id: string;
          visualization_url?: string | null;
        };
        Update: {
          analysis?: Json | null;
          created_at?: string | null;
          credits_used?: number | null;
          current_step?: string | null;
          daewun?: Json | null;
          error?: Json | null;
          estimated_time_remaining?: number | null;
          id?: string;
          jijanggan?: Json | null;
          pillars?: Json | null;
          profile_id?: string;
          progress_percent?: number | null;
          scores?: Json | null;
          status?: string;
          step_statuses?: Json | null;
          updated_at?: string | null;
          user_id?: string;
          visualization_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_reports_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          birth_date: string;
          birth_time: string | null;
          calendar_type: string | null;
          created_at: string | null;
          gender: string;
          id: string;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          birth_date: string;
          birth_time?: string | null;
          calendar_type?: string | null;
          created_at?: string | null;
          gender: string;
          id?: string;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          birth_date?: string;
          birth_time?: string | null;
          calendar_type?: string | null;
          created_at?: string | null;
          gender?: string;
          id?: string;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      purchases: {
        Row: {
          amount: number;
          created_at: string;
          credits: number;
          id: string;
          status: string;
          stripe_session_id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          credits: number;
          id?: string;
          status: string;
          stripe_session_id: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          credits?: number;
          id?: string;
          status?: string;
          stripe_session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchases_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reanalysis_logs: {
        Row: {
          created_at: string | null;
          credits_used: number | null;
          id: string;
          profile_id: string;
          report_id: string;
          section_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          credits_used?: number | null;
          id?: string;
          profile_id: string;
          report_id: string;
          section_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          credits_used?: number | null;
          id?: string;
          profile_id?: string;
          report_id?: string;
          section_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reanalysis_logs_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'profile_reports';
            referencedColumns: ['id'];
          },
        ];
      };
      report_questions: {
        Row: {
          answer: string;
          created_at: string | null;
          credits_used: number | null;
          id: string;
          profile_id: string | null;
          profile_report_id: string | null;
          question: string;
          user_id: string;
        };
        Insert: {
          answer: string;
          created_at?: string | null;
          credits_used?: number | null;
          id?: string;
          profile_id?: string | null;
          profile_report_id?: string | null;
          question: string;
          user_id: string;
        };
        Update: {
          answer?: string;
          created_at?: string | null;
          credits_used?: number | null;
          id?: string;
          profile_id?: string | null;
          profile_report_id?: string | null;
          question?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'report_questions_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'report_questions_profile_report_id_fkey';
            columns: ['profile_report_id'];
            isOneToOne: false;
            referencedRelation: 'profile_reports';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          credits: number;
          email: string;
          email_notifications_enabled: boolean;
          id: string;
          name: string | null;
          preferred_language: string;
          updated_at: string;
          yearly_reminder_enabled: boolean;
        };
        Insert: {
          created_at?: string;
          credits?: number;
          email: string;
          email_notifications_enabled?: boolean;
          id?: string;
          name?: string | null;
          preferred_language?: string;
          updated_at?: string;
          yearly_reminder_enabled?: boolean;
        };
        Update: {
          created_at?: string;
          credits?: number;
          email?: string;
          email_notifications_enabled?: boolean;
          id?: string;
          name?: string | null;
          preferred_language?: string;
          updated_at?: string;
          yearly_reminder_enabled?: boolean;
        };
        Relationships: [];
      };
      yearly_analyses: {
        Row: {
          analysis: Json;
          created_at: string | null;
          credits_used: number | null;
          current_daewun: Json | null;
          daewun: Json | null;
          existing_analysis_id: string | null;
          gender: string;
          id: string;
          language: string | null;
          pillars: Json;
          profile_id: string | null;
          target_year: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          analysis: Json;
          created_at?: string | null;
          credits_used?: number | null;
          current_daewun?: Json | null;
          daewun?: Json | null;
          existing_analysis_id?: string | null;
          gender: string;
          id?: string;
          language?: string | null;
          pillars: Json;
          profile_id?: string | null;
          target_year: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          analysis?: Json;
          created_at?: string | null;
          credits_used?: number | null;
          current_daewun?: Json | null;
          daewun?: Json | null;
          existing_analysis_id?: string | null;
          gender?: string;
          id?: string;
          language?: string | null;
          pillars?: Json;
          profile_id?: string | null;
          target_year?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'yearly_analyses_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      deduct_credits: {
        Args: { p_amount: number; p_user_id: string };
        Returns: {
          error_message: string;
          new_credits: number;
          success: boolean;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/**
 * AI 사용량 로그 타입
 */
export type AiUsageLog = Database['public']['Tables']['ai_usage_logs']['Row'];
export type AiUsageLogInsert = Database['public']['Tables']['ai_usage_logs']['Insert'];

/**
 * 기능 유형 타입
 */
export type FeatureType =
  | 'report_generation'
  | 'section_reanalysis'
  | 'follow_up_question'
  | 'yearly_analysis'
  | 'compatibility_analysis';
