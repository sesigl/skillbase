import type { Skill } from '../domain/skill/Skill';

export interface SkillOverviewCard {
  title: string;
  eyebrow: string;
  items: string[];
}

export interface SkillOverviewSignal {
  label: string;
  value: string;
  tone: 'accent' | 'muted' | 'warning';
}

export interface SkillOverview {
  summary: string;
  purpose: string;
  signals: SkillOverviewSignal[];
  cards: SkillOverviewCard[];
  contentMap: string[];
  supportingFiles: string[];
}

export function buildSkillOverview(skill: Skill): SkillOverview {
  const summary = firstSentence(skill.description);

  return {
    summary,
    purpose: skill.whenToUse?.trim() || summary,
    signals: buildSignals(skill),
    cards: buildCards(skill),
    contentMap: extractHeadingMap(skill.content),
    supportingFiles: skill.assets,
  };
}

function buildSignals(skill: Skill): SkillOverviewSignal[] {
  return [
    {
      label: 'Invocation',
      value: skill.userInvocable ? 'User-invocable' : 'Agent-only',
      tone: skill.userInvocable ? 'accent' : 'muted',
    },
    {
      label: 'Model access',
      value: skill.disableModelInvocation ? 'Disabled' : 'Allowed',
      tone: skill.disableModelInvocation ? 'warning' : 'muted',
    },
    {
      label: 'Source files',
      value: skill.assets.length > 0 ? `${skill.assets.length}` : 'SKILL.md only',
      tone: 'muted',
    },
  ];
}

function buildCards(skill: Skill): SkillOverviewCard[] {
  return [
    {
      eyebrow: 'Start here',
      title: 'Invocation contract',
      items: compact([
        skill.userInvocable
          ? 'Available for direct user invocation'
          : 'Not directly user-invocable',
        skill.disableModelInvocation
          ? 'Model invocation is disabled'
          : 'Model invocation is allowed',
        skill.argumentHint ? `Input hint: ${skill.argumentHint}` : undefined,
        formatList('Arguments', skill.arguments),
      ]),
    },
    {
      eyebrow: 'Guardrails',
      title: 'Operating bounds',
      items: withFallback(
        compact([
          formatList('Allowed tools', skill.allowedTools),
          formatList('Blocked tools', skill.disallowedTools),
          formatList('Path scope', skill.paths),
          skill.shell ? `Shell: ${skill.shell}` : undefined,
          skill.model ? `Model: ${skill.model}` : undefined,
          skill.effort ? `Effort: ${skill.effort}` : undefined,
          skill.agent ? `Agent: ${skill.agent}` : undefined,
        ]),
        'No explicit tool, path, or model policy declared'
      ),
    },
    {
      eyebrow: 'Catalog',
      title: 'Catalog signal',
      items: withFallback(
        compact([
          formatList('Tags', skill.tags),
          formatList('Providers', skill.providers),
          skill.license ? `License: ${skill.license}` : undefined,
          skill.compatibility ? `Compatibility: ${skill.compatibility}` : undefined,
          skill.assets.length > 0
            ? `${skill.assets.length} supporting file${skill.assets.length === 1 ? '' : 's'}`
            : undefined,
        ]),
        'No tags, providers, or supporting files declared'
      ),
    },
  ];
}

function compact(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => value !== undefined && value.trim().length > 0);
}

function withFallback(values: string[], fallback: string): string[] {
  return values.length > 0 ? values : [fallback];
}

function formatList(label: string, values: string[] | undefined): string | undefined {
  if (!values || values.length === 0) return undefined;

  const visible = values.slice(0, 3).join(', ');
  const overflow = values.length > 3 ? `, +${values.length - 3} more` : '';
  return `${label}: ${visible}${overflow}`;
}

function extractHeadingMap(content: string): string[] {
  return Array.from(content.matchAll(/^(#{1,3})\s+(.+)$/gm), (match) => cleanHeading(match[2]))
    .filter((heading) => heading.length > 0)
    .slice(0, 7);
}

function cleanHeading(value: string): string {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~#]/g, '')
    .trim();
}

function firstSentence(value: string): string {
  const sentence = value.match(/^[^.!?]+[.!?]/)?.[0];
  return sentence?.trim() || value.trim();
}
