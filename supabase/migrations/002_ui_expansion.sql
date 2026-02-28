-- Add new columns to fanfics
ALTER TABLE fanfics ADD COLUMN IF NOT EXISTS content_path text;
ALTER TABLE fanfics ADD COLUMN IF NOT EXISTS word_count integer default 0;

-- Additional indexes for library search
CREATE INDEX IF NOT EXISTS idx_fanfics_title ON fanfics(user_id, title_translated);
CREATE INDEX IF NOT EXISTS idx_fanfics_author ON fanfics(user_id, author);
CREATE INDEX IF NOT EXISTS idx_fanfics_created ON fanfics(user_id, created_at DESC);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  font_size text DEFAULT 'medium'
    CHECK (font_size IN ('small', 'medium', 'large', 'extra-large')),
  reading_theme text DEFAULT 'dark'
    CHECK (reading_theme IN ('light', 'dark', 'sepia')),
  reading_mode text DEFAULT 'scroll'
    CHECK (reading_mode IN ('scroll', 'paginated')),
  text_width text DEFAULT 'medium'
    CHECK (text_width IN ('narrow', 'medium', 'wide')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fanfic_id uuid REFERENCES fanfics(id) ON DELETE CASCADE NOT NULL,
  current_chapter integer DEFAULT 0,
  scroll_position float DEFAULT 0,
  progress_percent integer DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(user_id, fanfic_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON reading_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON reading_progress
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON reading_progress
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_reading_progress_fanfic ON reading_progress(user_id, fanfic_id);
