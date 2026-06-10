-- กำหนดส่งของงาน (optional) — ใส่จาก LINE ด้วย pattern @YYYY-MM-DD
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
