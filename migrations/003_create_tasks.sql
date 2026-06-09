-- การ์ดงานบน Kanban board
CREATE TABLE IF NOT EXISTS tasks (
  id                 TEXT PRIMARY KEY,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  status             TEXT NOT NULL DEFAULT 'todo',   -- todo | in_process | test | done
  source_message_id  TEXT REFERENCES line_messages (message_id),
  group_id           TEXT NOT NULL,
  created_by         TEXT REFERENCES users (id),
  assignee_id        TEXT REFERENCES users (id),     -- null = ยังไม่มีคนรับ
  priority           TEXT,                            -- low | medium | high (optional)
  position           INTEGER NOT NULL DEFAULT 0,      -- ลำดับการ์ดในคอลัมน์
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_group  ON tasks (group_id);
