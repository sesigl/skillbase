CREATE TABLE IF NOT EXISTS indexed_repositories (
  path TEXT PRIMARY KEY,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_status VARCHAR(20) NOT NULL DEFAULT 'valid'
);
