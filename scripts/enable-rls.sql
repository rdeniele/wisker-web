-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tool_notes ENABLE ROW LEVEL SECURITY;

-- Users: Can only access their own user record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid()::text = id);

-- Subjects: Users can only access their own subjects
CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  USING (auth.uid()::text = user_id);

-- Notes: Users can only access notes from their subjects
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = notes.subject_id
      AND subjects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = notes.subject_id
      AND subjects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = notes.subject_id
      AND subjects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = notes.subject_id
      AND subjects.user_id = auth.uid()::text
    )
  );

-- Learning Tools: Users can only access tools from their subjects/notes
CREATE POLICY "Users can view own learning tools"
  ON learning_tools FOR SELECT
  USING (
    (subject_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = learning_tools.subject_id
      AND subjects.user_id = auth.uid()::text
    ))
    OR
    (note_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM notes
      JOIN subjects ON subjects.id = notes.subject_id
      WHERE notes.id = learning_tools.note_id
      AND subjects.user_id = auth.uid()::text
    ))
  );

CREATE POLICY "Users can insert own learning tools"
  ON learning_tools FOR INSERT
  WITH CHECK (
    (subject_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = learning_tools.subject_id
      AND subjects.user_id = auth.uid()::text
    ))
    OR
    (note_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM notes
      JOIN subjects ON subjects.id = notes.subject_id
      WHERE notes.id = learning_tools.note_id
      AND subjects.user_id = auth.uid()::text
    ))
  );

CREATE POLICY "Users can delete own learning tools"
  ON learning_tools FOR DELETE
  USING (
    (subject_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = learning_tools.subject_id
      AND subjects.user_id = auth.uid()::text
    ))
    OR
    (note_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM notes
      JOIN subjects ON subjects.id = notes.subject_id
      WHERE notes.id = learning_tools.note_id
      AND subjects.user_id = auth.uid()::text
    ))
  );

-- Learning Tool Notes junction: Inherit permissions from learning tools
CREATE POLICY "Users can view own learning tool notes"
  ON learning_tool_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM learning_tools
      JOIN subjects ON subjects.id = learning_tools.subject_id
      WHERE learning_tools.id = learning_tool_notes.learning_tool_id
      AND subjects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert own learning tool notes"
  ON learning_tool_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_tools
      JOIN subjects ON subjects.id = learning_tools.subject_id
      WHERE learning_tools.id = learning_tool_notes.learning_tool_id
      AND subjects.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own learning tool notes"
  ON learning_tool_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM learning_tools
      JOIN subjects ON subjects.id = learning_tools.subject_id
      WHERE learning_tools.id = learning_tool_notes.learning_tool_id
      AND subjects.user_id = auth.uid()::text
    )
  );
