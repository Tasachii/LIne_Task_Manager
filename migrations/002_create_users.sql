-- Known users sourced from LINE.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- internal ID = line_user_id (same value for MVP)
  line_user_id  TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL DEFAULT 'Unknown',
  role          TEXT NOT NULL DEFAULT 'member',  -- member | admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
