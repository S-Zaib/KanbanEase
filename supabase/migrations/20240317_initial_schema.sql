-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up RLS (Row Level Security) policies
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Board policies
CREATE POLICY "Users can view their own boards" ON boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" ON boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON boards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON boards
  FOR DELETE USING (auth.uid() = user_id);

-- List policies (through board ownership)
CREATE POLICY "Users can view lists of their boards" ON lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lists on their boards" ON lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lists on their boards" ON lists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lists on their boards" ON lists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = lists.board_id AND boards.user_id = auth.uid()
    )
  );

-- Task policies (through list and board ownership)
CREATE POLICY "Users can view tasks on their boards" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON lists.board_id = boards.id
      WHERE tasks.list_id = lists.id AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks on their boards" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON lists.board_id = boards.id
      WHERE tasks.list_id = lists.id AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks on their boards" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON lists.board_id = boards.id
      WHERE tasks.list_id = lists.id AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks on their boards" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lists
      JOIN boards ON lists.board_id = boards.id
      WHERE tasks.list_id = lists.id AND boards.user_id = auth.uid()
    )
  );

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE boards, lists, tasks;