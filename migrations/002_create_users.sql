-- ผู้ใช้ที่ระบบรู้จัก (มาจาก LINE)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- รหัสภายใน = line_user_id (MVP ใช้ตัวเดียวกันไปก่อน)
  line_user_id  TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL DEFAULT 'Unknown',
  role          TEXT NOT NULL DEFAULT 'member',  -- member | admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
