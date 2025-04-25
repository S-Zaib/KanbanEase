import { Database as SupabaseDatabase } from './supabase';

// Extend the Supabase Database interface to include our enhanced types
export interface Database extends SupabaseDatabase {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          created_at: string;
          list_id: string;
          title: string;
          position: number;
          description?: string;
          due_date?: string;
          assigned_to?: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          list_id: string;
          title: string;
          position?: number;
          description?: string;
          due_date?: string;
          assigned_to?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          list_id?: string;
          title?: string;
          position?: number;
          description?: string;
          due_date?: string;
          assigned_to?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          created_at: string;
          updated_at?: string;
          task_id: string;
          user_id: string;
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          task_id: string;
          user_id: string;
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          task_id?: string;
          user_id?: string;
          content?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          email: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          updated_at?: string;
        };
      };
      board_members: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
          position: number;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          position?: number;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
          position?: number;
        };
      };
    } & SupabaseDatabase['public']['Tables'];
  };
} 