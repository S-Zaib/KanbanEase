-- First, disable RLS to clear existing policies
ALTER TABLE public.boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members DISABLE ROW LEVEL SECURITY;

-- Fix board policies
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
CREATE POLICY "Users can view their own boards" ON public.boards
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.board_members 
      WHERE board_members.board_id = boards.id AND board_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own boards" ON public.boards;
CREATE POLICY "Users can insert their own boards" ON public.boards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
CREATE POLICY "Users can update their own boards" ON public.boards
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;
CREATE POLICY "Users can delete their own boards" ON public.boards
  FOR DELETE
  USING (auth.uid() = user_id);

-- Fix board_members policies (these need explicit table references)
DROP POLICY IF EXISTS "Users can view boards they're members of" ON public.board_members;
CREATE POLICY "Users can view boards they're members of" ON public.board_members
  FOR SELECT
  USING (user_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM public.boards 
           WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()
         )
  );

DROP POLICY IF EXISTS "Board owners can insert members" ON public.board_members;
CREATE POLICY "Board owners can insert members" ON public.board_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Board owners can update members" ON public.board_members;
CREATE POLICY "Board owners can update members" ON public.board_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Board owners can delete members" ON public.board_members;
CREATE POLICY "Board owners can delete members" ON public.board_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_members.board_id AND boards.user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Make sure the board_members table exists and has the right structure
CREATE TABLE IF NOT EXISTS public.board_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- Re-enable RLS with the fixed policies
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY; 