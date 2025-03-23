-- Create board_members table for collaboration
CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (board_id, user_id)
);

-- Set up Row Level Security (RLS) for board_members
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Allow board members to see other members of the same board
CREATE POLICY "Board members can view other members of the same board" ON public.board_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.board_members
      WHERE board_id = board_members.board_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE id = board_members.board_id AND user_id = auth.uid()
    )
  );

-- Only board owners can add/delete members
CREATE POLICY "Only board owners can insert new members" ON public.board_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE id = board_members.board_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Only board owners can delete members" ON public.board_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE id = board_members.board_id AND user_id = auth.uid()
    )
  );

-- Add assigned_to column to tasks table for task assignments
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update board policy to allow members to access the board
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
CREATE POLICY "Users can view their own boards or boards they are members of" ON public.boards
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.board_members
      WHERE board_id = id AND user_id = auth.uid()
    )
  );

-- Update tasks due_date to include time
ALTER TABLE public.tasks
ALTER COLUMN due_date TYPE TIMESTAMPTZ; 