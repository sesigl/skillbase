import { SkillSchema } from '@lib/catalog/domain/skill/Skill';
import { describe, expect, it } from 'vitest';

const validSkill = {
  name: 'git-conventions',
  description: 'Conventional Commits enforcement via commitlint + Husky',
  disableModelInvocation: false,
  userInvocable: true,
  tags: ['git', 'conventions', 'commitlint'],
  providers: ['claude-code'],
  content: '# Git Conventions\n\nThis skill helps with conventional commits.',
  assets: [],
  sourceRepository: '/Users/dev/skills-repo',
  sourcePath: '/Users/dev/skills-repo/.claude/skills/git-conventions/SKILL.md',
};

describe('SkillSchema', () => {
  it('validates a complete skill with all fields', () => {
    const result = SkillSchema.safeParse({
      ...validSkill,
      license: 'MIT',
      compatibility: '>=1.0.0',
      allowedTools: ['Read', 'Write'],
      whenToUse: 'When creating commits',
      argumentHint: '[message]',
      arguments: ['message'],
      disallowedTools: ['Bash'],
      model: 'claude-sonnet-4',
      effort: 'high',
      context: 'fork',
      agent: 'Explore',
      hooks: { pre: 'echo "before"' },
      paths: ['src/**/*.ts'],
      shell: 'bash',
      metadata: { custom: 'value' },
    });
    expect(result.success).toBe(true);
  });

  it('validates a minimal skill with only required fields', () => {
    const result = SkillSchema.safeParse(validSkill);
    expect(result.success).toBe(true);
  });

  it('rejects skill with empty name', () => {
    const result = SkillSchema.safeParse({ ...validSkill, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects skill with name >64 chars', () => {
    const result = SkillSchema.safeParse({ ...validSkill, name: 'a'.repeat(65) });
    expect(result.success).toBe(false);
  });

  it('validates name with hyphens', () => {
    const result = SkillSchema.safeParse({ ...validSkill, name: 'my-skill-name' });
    expect(result.success).toBe(true);
  });

  it('rejects name with uppercase letters', () => {
    const result = SkillSchema.safeParse({ ...validSkill, name: 'Invalid-Name' });
    expect(result.success).toBe(false);
  });

  it('rejects name with underscores', () => {
    const result = SkillSchema.safeParse({ ...validSkill, name: 'invalid_name' });
    expect(result.success).toBe(false);
  });

  it('rejects skill with empty description', () => {
    const result = SkillSchema.safeParse({ ...validSkill, description: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional license field', () => {
    const without = SkillSchema.safeParse(validSkill);
    expect(without.success).toBe(true);
    const withLicense = SkillSchema.safeParse({ ...validSkill, license: 'MIT' });
    expect(withLicense.success).toBe(true);
  });

  it('accepts optional metadata as string-to-string map', () => {
    const result = SkillSchema.safeParse({ ...validSkill, metadata: { key: 'value' } });
    expect(result.success).toBe(true);
  });

  it('validates effort enum values', () => {
    for (const effort of ['low', 'medium', 'high', 'xhigh', 'max']) {
      const result = SkillSchema.safeParse({ ...validSkill, effort });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid effort value', () => {
    const result = SkillSchema.safeParse({ ...validSkill, effort: 'super-high' });
    expect(result.success).toBe(false);
  });

  it('validates shell enum values', () => {
    for (const shell of ['bash', 'powershell']) {
      const result = SkillSchema.safeParse({ ...validSkill, shell });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid shell value', () => {
    const result = SkillSchema.safeParse({ ...validSkill, shell: 'zsh' });
    expect(result.success).toBe(false);
  });

  it('validates context value', () => {
    const result = SkillSchema.safeParse({ ...validSkill, context: 'fork' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid context value', () => {
    const result = SkillSchema.safeParse({ ...validSkill, context: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts disableModelInvocation as boolean', () => {
    const withFlag = SkillSchema.safeParse({ ...validSkill, disableModelInvocation: true });
    expect(withFlag.success).toBe(true);
    const withoutFlag = SkillSchema.safeParse({ ...validSkill, disableModelInvocation: false });
    expect(withoutFlag.success).toBe(true);
  });

  it('accepts userInvocable as boolean', () => {
    const withFlag = SkillSchema.safeParse({ ...validSkill, userInvocable: false });
    expect(withFlag.success).toBe(true);
  });

  it('accepts arrays for list fields', () => {
    const result = SkillSchema.safeParse({
      ...validSkill,
      allowedTools: ['Read', 'Bash'],
      disallowedTools: ['Write'],
      arguments: ['path', 'name'],
      paths: ['src/**/*.ts', 'docs/**/*.md'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts hooks as a record', () => {
    const result = SkillSchema.safeParse({
      ...validSkill,
      hooks: { pre: 'echo "before"', post: 'echo "after"' },
    });
    expect(result.success).toBe(true);
  });

  it('validates compatibility max length 500', () => {
    const short = SkillSchema.safeParse({ ...validSkill, compatibility: '>=1.0.0' });
    expect(short.success).toBe(true);

    const tooLong = SkillSchema.safeParse({ ...validSkill, compatibility: 'a'.repeat(501) });
    expect(tooLong.success).toBe(false);
  });
});
