import { describe, expect, it } from 'vitest';
import type { Skill } from '@lib/catalog/domain/skill/Skill';

function createSkill(overrides?: Partial<Skill>): Skill {
  return {
    name: 'test-skill',
    description: 'A test skill',
    disableModelInvocation: false,
    userInvocable: true,
    tags: [],
    providers: [],
    content: 'Some content',
    assets: [],
    sourceRepository: '/tmp/test-repo',
    sourcePath: '/tmp/test-repo/.claude/skills/test-skill/SKILL.md',
    ...overrides,
  };
}

describe('classifySkillFields', () => {
  it('returns header fields for a minimal skill', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill();

    const result = classifySkillFields(skill);

    expect(result.header.name).toBe('test-skill');
    expect(result.header.description).toBe('A test skill');
    expect(result.header.sourceRepository).toBe('/tmp/test-repo');
    expect(result.header.isUserInvocable).toBe(true);
    expect(result.header.isModelInvocationDisabled).toBe(false);
    expect(result.sidebar).toHaveLength(0);
  });

  it('classifies scalar optional fields in the sidebar', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      license: 'MIT',
      compatibility: 'Claude Code >= 1.0',
      model: 'claude-sonnet-4-20250514',
      effort: 'medium',
      context: 'fork',
      agent: 'builder',
      shell: 'bash',
      argumentHint: '--verbose',
      whenToUse: 'When deploying to production',
    });

    const result = classifySkillFields(skill);

    const scalarLabels = result.sidebar.filter((f) => f.kind === 'scalar').map((f) => f.label);

    expect(scalarLabels).toContain('License');
    expect(scalarLabels).toContain('Compatibility');
    expect(scalarLabels).toContain('Model');
    expect(scalarLabels).toContain('Effort');
    expect(scalarLabels).toContain('Context');
    expect(scalarLabels).toContain('Agent');
    expect(scalarLabels).toContain('Shell');
    expect(scalarLabels).toContain('Argument hint');
    expect(scalarLabels).toContain('When to use');
  });

  it('excludes undefined optional fields from the sidebar', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      license: 'MIT',
    });

    const result = classifySkillFields(skill);

    expect(result.sidebar).toHaveLength(1);
    expect(result.sidebar[0].label).toBe('License');
  });

  it('classifies list fields with 3 or fewer items', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      allowedTools: ['Bash', 'Read'],
      arguments: ['--force'],
    });

    const result = classifySkillFields(skill);

    const listFields = result.sidebar.filter((f) => f.kind === 'list');
    expect(listFields).toHaveLength(2);
  });

  it('classifies list fields with more than 3 items', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      allowedTools: ['Bash', 'Read', 'Write', 'Glob', 'Grep'],
    });

    const result = classifySkillFields(skill);

    const listField = result.sidebar.find((f) => f.label === 'Allowed tools');
    expect(listField?.kind).toBe('list');
    expect(Array.isArray(listField?.value)).toBe(true);
    expect((listField?.value as string[]).length).toBe(5);
  });

  it('classifies tags as pills', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      tags: ['deploy', 'security', 'ci'],
    });

    const result = classifySkillFields(skill);

    const tagsField = result.sidebar.find((f) => f.label === 'Tags');
    expect(tagsField?.kind).toBe('pills');
    expect(tagsField?.value).toEqual(['deploy', 'security', 'ci']);
  });

  it('does not include tags in sidebar when empty', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({ tags: [] });

    const result = classifySkillFields(skill);

    expect(result.sidebar.find((f) => f.label === 'Tags')).toBeUndefined();
  });

  it('classifies providers as entries', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      providers: ['anthropic', 'opencode'],
    });

    const result = classifySkillFields(skill);

    const providersField = result.sidebar.find((f) => f.label === 'Providers');
    expect(providersField?.kind).toBe('entries');
    expect(providersField?.value).toEqual(['anthropic', 'opencode']);
  });

  it('classifies hooks as object', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      hooks: { preInstall: 'echo hello', postInstall: 'echo done' },
    });

    const result = classifySkillFields(skill);

    const hooksField = result.sidebar.find((f) => f.label === 'Hooks');
    expect(hooksField?.kind).toBe('object');
  });

  it('classifies recognized metadata keys as scalar', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      metadata: { author: 'Alice', version: '1.0.0', custom: 'value' },
    });

    const result = classifySkillFields(skill);

    const authorField = result.sidebar.find((f) => f.label === 'Author');
    expect(authorField?.kind).toBe('scalar');
    expect(authorField?.value).toBe('Alice');

    const versionField = result.sidebar.find((f) => f.label === 'Version');
    expect(versionField?.kind).toBe('scalar');
    expect(versionField?.value).toBe('1.0.0');

    const customField = result.sidebar.find((f) => f.label === 'custom');
    expect(customField?.kind).toBe('scalar');
    expect(customField?.value).toBe('value');
  });

  it('preserves sidebar field order', async () => {
    const { classifySkillFields } = await import('@lib/catalog/application/classifySkillFields');
    const skill = createSkill({
      license: 'MIT',
      model: 'claude-sonnet-4-20250514',
      effort: 'medium',
      tags: ['deploy'],
    });

    const result = classifySkillFields(skill);

    const labels = result.sidebar.map((f) => f.label);
    expect(labels[0]).toBe('License');
    expect(labels[1]).toBe('Model');
    expect(labels[2]).toBe('Effort');
    expect(labels[labels.length - 1]).toBe('Tags');
  });
});
