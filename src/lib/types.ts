export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      claims: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          loss_date: string;
          loss_cause: string;
          location: string;
          narrative: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          loss_date: string;
          loss_cause: string;
          location: string;
          narrative: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['claims']['Insert']>;
      };
      areas: {
        Row: {
          id: string;
          claim_id: string;
          name: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          name: string;
          notes?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['areas']['Insert']>;
      };
      damage_items: {
        Row: {
          id: string;
          claim_id: string;
          area_id: string;
          category: string;
          description: string;
          qty: number;
          unit: string;
          dimensions: string;
          condition_notes: string;
          status: string;
          est_replacement_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          area_id: string;
          category: string;
          description: string;
          qty: number;
          unit: string;
          dimensions?: string;
          condition_notes?: string;
          status?: string;
          est_replacement_cost?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['damage_items']['Insert']>;
      };
      evidence: {
        Row: {
          id: string;
          claim_id: string;
          damage_item_id: string | null;
          file_path: string;
          file_type: string;
          caption: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          damage_item_id?: string | null;
          file_path: string;
          file_type: string;
          caption?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['evidence']['Insert']>;
      };
      insurer_requests: {
        Row: {
          id: string;
          claim_id: string;
          request_text: string;
          due_date: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          request_text: string;
          due_date?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['insurer_requests']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          claim_id: string;
          insurer_request_id: string | null;
          title: string;
          status: string;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          insurer_request_id?: string | null;
          title: string;
          status?: string;
          due_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
    };
  };
}
