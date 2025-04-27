-- Add priority field to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'::text 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add index for potential future filtering/sorting
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
 
 -- Run this SQL in your Supabase SQL editor to verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks';

-- If the priority column doesn't exist, add it
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';