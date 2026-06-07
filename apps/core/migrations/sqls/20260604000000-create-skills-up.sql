CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  version VARCHAR(20) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  providers TEXT[] NOT NULL DEFAULT '{}',
  license VARCHAR(50) NOT NULL,
  homepage VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, author)
);

CREATE INDEX IF NOT EXISTS idx_skills_name_author ON skills(name, author);
CREATE INDEX IF NOT EXISTS idx_skills_tags ON skills USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_skills_providers ON skills USING GIN(providers);
