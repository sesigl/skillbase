import { describe, expect, it } from 'vitest';
import type { Skill } from '@lib/catalog/domain/skill/Skill';
import { buildSkillOverview } from '@lib/catalog/presentation/buildSkillOverview';

describe('buildSkillOverview', () => {
  it('turns a rich skill into a scan-first operator brief', () => {
    const overview = buildSkillOverview(
      skill({
        whenToUse: 'Use when reviewing production deployment plans.',
        allowedTools: ['Read', 'Grep', 'Bash'],
        disallowedTools: ['Write'],
        argumentHint: '<ticket-id>',
        model: 'claude-sonnet-4-5',
        effort: 'high',
        tags: ['deploy', 'review'],
        providers: ['anthropic'],
        assets: ['templates/checklist.md'],
        content: `# Full runbook

Long prose that should stay out of the overview.

## Inputs

More details.

## Review checklist

More details.`,
      })
    );

    expect(overview.purpose).toBe('Use when reviewing production deployment plans.');
    expect(overview.cards.map((card) => card.title)).toEqual([
      'Invocation contract',
      'Operating bounds',
      'Catalog signal',
    ]);
    expect(overview.contentMap).toEqual(['Full runbook', 'Inputs', 'Review checklist']);
    expect(overview.cards.flatMap((card) => card.items)).not.toContain(
      'Long prose that should stay out of the overview.'
    );
  });

  it('keeps sparse skills useful without empty placeholders', () => {
    const overview = buildSkillOverview(skill());

    expect(overview.purpose).toBe('A focused test skill');
    expect(overview.contentMap).toEqual([]);
    expect(overview.supportingFiles).toEqual([]);
    expect(overview.cards[1].items).toEqual(['No explicit tool, path, or model policy declared']);
  });

  it('keeps fallback descriptions concise for the overview brief', () => {
    const overview = buildSkillOverview(
      skill({
        description:
          'Use this skill to inspect production incidents. It also includes long operational details that belong in the source tab.',
      })
    );

    expect(overview.summary).toBe('Use this skill to inspect production incidents.');
    expect(overview.purpose).toBe('Use this skill to inspect production incidents.');
  });
});

function skill(overrides?: Partial<Skill>): Skill {
  return {
    name: 'test-skill',
    description: 'A focused test skill',
    disableModelInvocation: false,
    userInvocable: true,
    tags: [],
    providers: [],
    content: 'Plain markdown body without headings.',
    assets: [],
    sourceRepository: '/tmp/test-repo',
    sourcePath: '/tmp/test-repo/skills/test-skill/SKILL.md',
    ...overrides,
  };
}
