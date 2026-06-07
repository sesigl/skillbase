ALTER TABLE skill_invocations ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_skill_invocations_skill_user ON skill_invocations (skill_name, user_id);
