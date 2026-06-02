-- EXO-GENESIS: Guide system — fragments, progress tracking, events
-- Run this in Supabase SQL Editor

-- 1. Fragment currency on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_fragments INTEGER DEFAULT 0;

-- 2. Guide progress per entry
CREATE TABLE IF NOT EXISTS guide_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked',  -- locked | researched | glitched
  UNIQUE(user_id, chapter_id, entry_id)
);

-- 3. Chapter completion and reward tracking
CREATE TABLE IF NOT EXISTS chapter_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(user_id, chapter_id)
);

-- 4. User action events (for dynamic chapter unlocks)
CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_key)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_guide_progress_user ON guide_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user ON chapter_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_key ON user_events(event_key);
