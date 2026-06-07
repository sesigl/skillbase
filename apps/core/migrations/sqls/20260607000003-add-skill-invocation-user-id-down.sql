DROP INDEX IF EXISTS idx_skill_invocations_skill_user;

ALTER TABLE skill_invocations DROP COLUMN IF EXISTS user_id;
