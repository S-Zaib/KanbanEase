import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export type List = {
  id: string;
  board_id: string;
  name: string;
  created_at: string;
};

export type Task = {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type Board = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
};

// For development/testing purposes only
export const DEFAULT_BOARD_ID = 'default-board';