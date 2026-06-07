CREATE TABLE IF NOT EXISTS skill_invocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name      TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('native', 'file_read')),
  tool_name       TEXT NOT NULL,
  file_path       TEXT,
  timestamp       TIMESTAMPTZ NOT NULL,
  session_id      TEXT,
  idempotency_key TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_skill_invocations_timestamp ON skill_invocations (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_skill_invocations_skill_name ON skill_invocations (skill_name);
