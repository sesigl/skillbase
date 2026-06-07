import type { Skill } from '../domain/skill/Skill';

export interface SkillHeaderFields {
  name: string;
  description: string;
  sourceRepository: string;
  isUserInvocable: boolean;
  isModelInvocationDisabled: boolean;
}

export type SidebarFieldKind = 'scalar' | 'list' | 'pills' | 'entries' | 'object';

export interface SidebarField {
  label: string;
  kind: SidebarFieldKind;
  value: string | string[] | Record<string, string> | Record<string, unknown>;
}

interface ClassifiedFields {
  header: SkillHeaderFields;
  sidebar: SidebarField[];
}

function addScalar(fields: SidebarField[], label: string, value: string | undefined): void {
  if (value !== undefined) {
    fields.push({ label, kind: 'scalar', value });
  }
}

function addList(fields: SidebarField[], label: string, value: string[] | undefined): void {
  if (value !== undefined && value.length > 0) {
    fields.push({ label, kind: 'list', value });
  }
}

function addPills(fields: SidebarField[], label: string, value: string[]): void {
  if (value.length > 0) {
    fields.push({ label, kind: 'pills', value });
  }
}

function addEntries(fields: SidebarField[], label: string, value: string[]): void {
  if (value.length > 0) {
    fields.push({ label, kind: 'entries', value });
  }
}

function addObject(
  fields: SidebarField[],
  label: string,
  value: Record<string, unknown> | undefined
): void {
  if (value !== undefined) {
    fields.push({ label, kind: 'object', value });
  }
}

export function classifySkillFields(skill: Skill): ClassifiedFields {
  const header: SkillHeaderFields = {
    name: skill.name,
    description: skill.description,
    sourceRepository: skill.sourceRepository,
    isUserInvocable: skill.userInvocable,
    isModelInvocationDisabled: skill.disableModelInvocation,
  };

  const sidebar: SidebarField[] = [];

  addScalar(sidebar, 'License', skill.license);
  addScalar(sidebar, 'Compatibility', skill.compatibility);
  addScalar(sidebar, 'Model', skill.model);
  addScalar(sidebar, 'Effort', skill.effort);
  addScalar(sidebar, 'Context', skill.context);
  addScalar(sidebar, 'Agent', skill.agent);
  addScalar(sidebar, 'Shell', skill.shell);
  addScalar(sidebar, 'Argument hint', skill.argumentHint);
  addScalar(sidebar, 'When to use', skill.whenToUse);

  addList(sidebar, 'Allowed tools', skill.allowedTools);
  addList(sidebar, 'Disallowed tools', skill.disallowedTools);
  addList(sidebar, 'Arguments', skill.arguments);
  addList(sidebar, 'Paths', skill.paths);

  if (skill.metadata) {
    if (skill.metadata.author) {
      addScalar(sidebar, 'Author', skill.metadata.author);
    }
    if (skill.metadata.version) {
      addScalar(sidebar, 'Version', skill.metadata.version);
    }
    for (const [key, value] of Object.entries(skill.metadata)) {
      if (key !== 'author' && key !== 'version' && key !== 'tags' && key !== 'providers') {
        addScalar(sidebar, key, value);
      }
    }
  }

  addObject(sidebar, 'Hooks', skill.hooks as Record<string, unknown> | undefined);
  addPills(sidebar, 'Tags', skill.tags);
  addEntries(sidebar, 'Providers', skill.providers);

  return { header, sidebar };
}
