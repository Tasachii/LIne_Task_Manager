-- Optional due date for a task — supplied from LINE using the @YYYY-MM-DD pattern.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
