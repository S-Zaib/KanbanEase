-- Create labels table
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create task_labels junction table
CREATE TABLE IF NOT EXISTS public.task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(task_id, label_id)
);

-- Set up Row Level Security for labels
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Labels RLS policies
CREATE POLICY "Users can view labels for boards they have access to" ON public.labels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE b.id = labels.board_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create labels for boards they own" ON public.labels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE id = board_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update labels for boards they own" ON public.labels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE id = board_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete labels for boards they own" ON public.labels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE id = board_id AND user_id = auth.uid()
    )
  );

-- Task labels RLS policies
CREATE POLICY "Users can view task labels for tasks they can access" ON public.task_labels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE t.id = task_labels.task_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add labels to tasks they can access" ON public.task_labels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE t.id = task_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can remove labels from tasks they can access" ON public.task_labels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      LEFT JOIN public.board_members bm ON bm.board_id = b.id
      WHERE t.id = task_labels.task_id AND (b.user_id = auth.uid() OR bm.user_id = auth.uid())
    )
  );