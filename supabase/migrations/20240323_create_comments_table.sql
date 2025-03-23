-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own comments or comments on tasks they can access
CREATE POLICY "Users can view comments on tasks they can access" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      WHERE t.id = comments.task_id AND b.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert their own comments
CREATE POLICY "Users can insert their own comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.lists l ON t.list_id = l.id
      JOIN public.boards b ON l.board_id = b.id
      WHERE t.id = task_id AND b.user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Create policy to allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Create profiles table for user emails if not exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Set up RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to view profiles
CREATE POLICY "Profiles are viewable by all users" ON public.profiles
  FOR SELECT USING (true);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to add new users to profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 