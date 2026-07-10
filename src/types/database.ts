/**
 * GENERATED FILE — do not hand-edit.
 *
 * Regenerate after every schema change with:
 *   npm run db:types   (requires `supabase start` for the local stack)
 *
 * This checked-in version matches supabase/migrations/0001_profiles.sql so
 * the template typechecks before Supabase is linked.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          entitlement: string;
          product_id: string | null;
          status: 'active' | 'expired' | 'billing_issue' | 'cancelled';
          current_period_ends_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          entitlement: string;
          product_id?: string | null;
          status: 'active' | 'expired' | 'billing_issue' | 'cancelled';
          current_period_ends_at?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          entitlement?: string;
          product_id?: string | null;
          status?: 'active' | 'expired' | 'billing_issue' | 'cancelled';
          current_period_ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
