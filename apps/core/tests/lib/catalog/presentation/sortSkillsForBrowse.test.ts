import { describe, expect, it } from 'vitest';
import type { Skill } from '../../../../src/lib/catalog/domain/skill/Skill';
import {
  parseSkillSort,
  sortSkillsForBrowse,
} from '../../../../src/lib/catalog/presentation/sortSkillsForBrowse';

describe('sortSkillsForBrowse', () => {
  it('defaults unknown sort values to unique users', () => {
    expect(parseSkillSort(null)).toBe('users');
    expect(parseSkillSort('unknown')).toBe('users');
    expect(parseSkillSort('invocations')).toBe('invocations');
    expect(parseSkillSort('name')).toBe('name');
  });

  it('sorts by unique users in the last 30 days by default', () => {
    const skills = [skill('git-conventions'), skill('frontend-design'), skill('agent-browser')];
    const sorted = sortSkillsForBrowse(
      skills,
      {
        'agent-browser': { uniqueUsersLast30Days: 2, invocationsLast30Days: 25 },
        'frontend-design': { uniqueUsersLast30Days: 3, invocationsLast30Days: 10 },
        'git-conventions': { uniqueUsersLast30Days: 2, invocationsLast30Days: 30 },
      },
      'users'
    );

    expect(sorted.map((item) => item.name)).toEqual([
      'frontend-design',
      'git-conventions',
      'agent-browser',
    ]);
  });

  it('supports invocation and name sorting', () => {
    const skills = [skill('git-conventions'), skill('frontend-design'), skill('agent-browser')];
    const usage = {
      'agent-browser': { uniqueUsersLast30Days: 4, invocationsLast30Days: 25 },
      'frontend-design': { uniqueUsersLast30Days: 5, invocationsLast30Days: 10 },
      'git-conventions': { uniqueUsersLast30Days: 2, invocationsLast30Days: 30 },
    };

    expect(sortSkillsForBrowse(skills, usage, 'invocations').map((item) => item.name)).toEqual([
      'git-conventions',
      'agent-browser',
      'frontend-design',
    ]);
    expect(sortSkillsForBrowse(skills, usage, 'name').map((item) => item.name)).toEqual([
      'agent-browser',
      'frontend-design',
      'git-conventions',
    ]);
  });
});

function skill(name: string): Skill {
  return {
    name,
    description: `${name} description`,
    disableModelInvocation: false,
    userInvocable: true,
    tags: [],
    providers: [],
    content: '',
    assets: [],
    sourceRepository: '/skills',
    sourcePath: `/skills/${name}/SKILL.md`,
  };
}
