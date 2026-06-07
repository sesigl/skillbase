import type { Skill } from '../domain/skill/Skill';

export type SkillSort = 'users' | 'invocations' | 'name';

export interface SkillBrowseUsage {
  uniqueUsersLast30Days: number;
  invocationsLast30Days: number;
}

export function parseSkillSort(value: string | null): SkillSort {
  return value === 'invocations' || value === 'name' ? value : 'users';
}

export function sortSkillsForBrowse(
  skills: Skill[],
  usageBySkillName: Record<string, SkillBrowseUsage | undefined>,
  sort: SkillSort
): Skill[] {
  return [...skills].sort((a, b) => {
    const aUsage = usageBySkillName[a.name];
    const bUsage = usageBySkillName[b.name];

    if (sort === 'name') return a.name.localeCompare(b.name);

    if (sort === 'invocations') {
      return (
        (bUsage?.invocationsLast30Days ?? 0) - (aUsage?.invocationsLast30Days ?? 0) ||
        (bUsage?.uniqueUsersLast30Days ?? 0) - (aUsage?.uniqueUsersLast30Days ?? 0) ||
        a.name.localeCompare(b.name)
      );
    }

    return (
      (bUsage?.uniqueUsersLast30Days ?? 0) - (aUsage?.uniqueUsersLast30Days ?? 0) ||
      (bUsage?.invocationsLast30Days ?? 0) - (aUsage?.invocationsLast30Days ?? 0) ||
      a.name.localeCompare(b.name)
    );
  });
}
