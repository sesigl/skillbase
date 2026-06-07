import { parse as parseYaml } from 'yaml';

export interface FrontmatterResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

export function parseFrontmatter(content: string): FrontmatterResult {
  if (!content.startsWith('---')) {
    return { frontmatter: {}, body: content };
  }

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const yamlBlock = content.slice(3, endIndex).trim();
  const body = content.slice(endIndex + 3).trimStart();

  if (!yamlBlock) {
    return { frontmatter: {}, body };
  }

  try {
    const parsed = parseYaml(yamlBlock);
    if (typeof parsed !== 'object' || parsed === null) {
      return { frontmatter: {}, body };
    }
    return { frontmatter: parsed as Record<string, unknown>, body };
  } catch {
    return { frontmatter: {}, body };
  }
}
