-- Create subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Set up Row Level Security (RLS) for subtasks
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select subtasks of tasks they can access
CREATE POLICY "Users can view subtasks of tasks they can access" ON public.subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE t.id = subtasks.task_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

-- Create policy to allow users to insert subtasks for tasks they can access
CREATE POLICY "Users can insert subtasks for tasks they can access" ON public.subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE t.id = task_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

-- Create policy to allow users to update subtasks of tasks they can access
CREATE POLICY "Users can update subtasks of tasks they can access" ON public.subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE t.id = subtasks.task_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

-- Create policy to allow users to delete subtasks of tasks they can access
CREATE POLICY "Users can delete subtasks of tasks they can access" ON public.subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE t.id = subtasks.task_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_subtask_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subtask_timestamp ON public.subtasks;
CREATE TRIGGER update_subtask_timestamp
BEFORE UPDATE ON public.subtasks
FOR EACH ROW EXECUTE FUNCTION update_subtask_updated_at();