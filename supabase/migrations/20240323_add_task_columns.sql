-- Add description and due_date columns to the tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS due_date DATE; 