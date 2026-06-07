INSERT INTO skills (name, author, description, version, tags, providers, license)
VALUES
  (
    'Git Conventions',
    'skillbase',
    'Conventional Commits enforcement via commitlint and Husky. Ensures every commit in your project follows the Conventional Commits specification.',
    '1.0.0',
    ARRAY['git', 'conventions', 'commitlint'],
    ARRAY['opencode', 'claude-code'],
    'MIT'
  ),
  (
    'Frontend Design',
    'skillbase',
    'Create distinctive, production-grade frontend interfaces with high design quality. Generates polished UI code that avoids generic AI aesthetics.',
    '1.0.0',
    ARRAY['frontend', 'design', 'tailwind', 'ui'],
    ARRAY['opencode'],
    'MIT'
  ),
  (
    'PDF Toolkit',
    'skillbase',
    'Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms.',
    '1.0.0',
    ARRAY['pdf', 'documents', 'forms'],
    ARRAY['opencode', 'claude-code'],
    'MIT'
  ),
  (
    'Clean Code Reviewer',
    'skillbase',
    'Post-implementation code review and refactoring. Focuses on simplicity, readability, and high-quality, refactoring-safe testing.',
    '1.0.0',
    ARRAY['code-review', 'refactoring', 'testing'],
    ARRAY['opencode', 'claude-code'],
    'MIT'
  ),
  (
    'Security Review',
    'skillbase',
    'Automated security review of dependencies and code patterns. Audits for known vulnerabilities and insecure configurations.',
    '1.0.0',
    ARRAY['security', 'audit', 'dependencies'],
    ARRAY['opencode', 'claude-code'],
    'MIT'
  )
ON CONFLICT (name, author) DO NOTHING;
