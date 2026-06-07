import { describe, expect, it } from 'vitest';
import { SkillSchema } from '@lib/shared/skill';

const validSkill = {
  name: 'Git Conventions',
  author: 'skillbase',
  description: 'Conventional Commits enforcement via commitlint + Husky',
  version: '1.0.0',
  tags: ['git', 'conventions', 'commitlint'],
  providers: ['opencode', 'claude-code'],
  license: 'MIT',
};

describe('SkillSchema', () => {
  it('validates a complete skill', () => {
    const result = SkillSchema.safeParse(validSkill);
    expect(result.success).toBe(true);
  });

  it('rejects skill with empty name', () => {
    const result = SkillSchema.safeParse({ ...validSkill, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects skill with invalid version', () => {
    const result = SkillSchema.safeParse({ ...validSkill, version: 'not-semver' });
    expect(result.success).toBe(false);
  });

  it('rejects skill with empty tags array', () => {
    const result = SkillSchema.safeParse({ ...validSkill, tags: [] });
    expect(result.success).toBe(false);
  });

  it('accepts skill without homepage', () => {
    const result = SkillSchema.safeParse({
      name: validSkill.name,
      author: validSkill.author,
      description: validSkill.description,
      version: validSkill.version,
      tags: validSkill.tags,
      providers: validSkill.providers,
      license: validSkill.license,
    });
    expect(result.success).toBe(true);
  });
});
