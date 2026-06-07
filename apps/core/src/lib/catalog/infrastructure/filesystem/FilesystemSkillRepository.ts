import { type Dirent, readdirSync, readFileSync, type Stats, statSync } from 'node:fs';
import { join } from 'node:path';
import { type Skill, SkillSchema } from '../../domain/skill/Skill';
import type { SkillRepository } from '../../domain/skill/SkillRepository';
import type {
  RepositoryType,
  RepositoryScanResult,
  ValidationError,
} from '../../domain/repository-registry/IndexedRepository';
import { findGitRoot, findSkillDirectories, detectRepositoryType } from '../../../shared/git-utils';
import { parseFrontmatter } from './frontmatter';

const TAG_TAXONOMY = [
  'deploy',
  'test',
  'security',
  'review',
  'frontend',
  'api',
  'git',
  'documentation',
  'deployment',
  'testing',
  'backend',
  'database',
  'refactoring',
  'monitoring',
  'ci',
  'cd',
];

const SKILL_MD_MAX_BYTES = 1_048_576;

export class FilesystemSkillRepository implements SkillRepository {
  async findAll(repoPaths?: string[]): Promise<Skill[]> {
    if (!repoPaths || repoPaths.length === 0) return [];
    const allSkills: Skill[] = [];
    for (const repoPath of repoPaths) {
      const result = this.scanRepository(repoPath);
      allSkills.push(...result.skills);
    }
    return allSkills;
  }

  async search(query: string, repoPaths?: string[]): Promise<Skill[]> {
    const all = await this.findAll(repoPaths);
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter(
      (skill) =>
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.tags.some((t) => t.toLowerCase() === q) ||
        skill.providers.some((p) => p.toLowerCase() === q)
    );
  }

  scanRepository(repoPath: string): RepositoryScanResult {
    const gitRoot = findGitRoot(repoPath);
    if (!gitRoot) {
      return {
        repository: repoPath,
        status: 'invalid',
        skills: [],
        validationErrors: [{ file: repoPath, message: 'Not a git repository' }],
        warnings: [],
        repositoryType: 'standalone',
      };
    }

    const repoType = detectRepositoryType(gitRoot);

    const skillDirs = findSkillDirectories(gitRoot);
    if (skillDirs.length === 0) {
      return {
        repository: repoPath,
        status: 'invalid',
        skills: [],
        validationErrors: [
          {
            file: repoPath,
            message: `No skills found — repository has no .claude/skills/, skills/, or plugins/*/skills/ directory`,
          },
        ],
        warnings: [],
        repositoryType: repoType ?? 'standalone',
      };
    }

    return this.scanSkillDirectories(gitRoot, skillDirs, repoType ?? 'standalone');
  }

  private scanSkillDirectories(
    gitRoot: string,
    skillDirs: string[],
    repositoryType: RepositoryType
  ): RepositoryScanResult {
    const allSkills: Skill[] = [];
    const allErrors: ValidationError[] = [];
    const allWarnings: string[] = [];

    for (const skillsDir of skillDirs) {
      const result = this.scanSingleSkillsDirectory(gitRoot, skillsDir);
      allSkills.push(...result.skills);
      allErrors.push(...result.validationErrors);
      allWarnings.push(...result.warnings);
    }

    const status = allErrors.length > 0 ? 'invalid' : 'valid';

    return {
      repository: gitRoot,
      status,
      skills: allSkills,
      validationErrors: allErrors,
      warnings: allWarnings,
      repositoryType,
    };
  }

  private scanSingleSkillsDirectory(
    gitRoot: string,
    skillsDir: string
  ): { skills: Skill[]; validationErrors: ValidationError[]; warnings: string[] } {
    const skills: Skill[] = [];
    const validationErrors: ValidationError[] = [];
    const warnings: string[] = [];

    const entries = this.readSkillsDirEntries(skillsDir);
    if (entries === null) {
      return { skills, validationErrors, warnings };
    }

    let hasAnySkillMd = false;

    for (const entry of entries) {
      if (!(entry.isDirectory() || entry.isSymbolicLink())) continue;

      const skillDirPath = join(skillsDir, entry.name);

      let dirStat: Stats | null = null;
      try {
        dirStat = statSync(skillDirPath);
      } catch {
        continue;
      }

      if (!dirStat.isDirectory()) continue;

      const skillMdPath = join(skillDirPath, 'SKILL.md');

      try {
        statSync(skillMdPath);
      } catch {
        warnings.push(`Directory ${entry.name} has no SKILL.md file — ignored`);
        continue;
      }

      hasAnySkillMd = true;

      const parseResult = this.parseSkillFile(skillMdPath, entry.name, gitRoot);
      if (parseResult.skill) {
        skills.push(parseResult.skill);
      }
      validationErrors.push(...parseResult.errors);
      warnings.push(...parseResult.warnings);
    }

    if (!hasAnySkillMd) {
      validationErrors.push({
        file: skillsDir,
        message: 'no SKILL.md files found',
      });
    }

    return { skills, validationErrors, warnings };
  }

  private readSkillsDirEntries(skillsDir: string): Dirent[] | null {
    try {
      return readdirSync(skillsDir, { withFileTypes: true });
    } catch {
      return null;
    }
  }

  private parseSkillFile(
    filePath: string,
    dirName: string,
    repoRoot: string
  ): { skill: Skill | null; errors: ValidationError[]; warnings: string[] } {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    let rawContent: string;
    try {
      const stat = statSync(filePath);
      if (stat.size > SKILL_MD_MAX_BYTES) {
        warnings.push(`SKILL.md for ${dirName} exceeds 1MB — results may be incomplete`);
      }
      rawContent = readFileSync(filePath, 'utf-8');
    } catch (err) {
      if (isPermissionError(err)) {
        errors.push({ file: filePath, message: `Permission denied: ${filePath}` });
      } else {
        errors.push({ file: filePath, message: `Cannot read file: ${filePath}` });
      }
      return { skill: null, errors, warnings };
    }

    const { frontmatter, body } = parseFrontmatter(rawContent);

    const frontmatterName = typeof frontmatter.name === 'string' ? frontmatter.name : undefined;
    if (frontmatterName && frontmatterName !== dirName) {
      errors.push({
        file: filePath,
        message: `Skill name "${frontmatterName}" does not match directory name "${dirName}"`,
      });
    }

    const description =
      typeof frontmatter.description === 'string' && frontmatter.description.length > 0
        ? frontmatter.description
        : extractFirstParagraph(body);

    const tags = deriveTags(frontmatter, dirName, description);
    const providers = deriveProviders(frontmatter);

    const skillData = buildSkillData(frontmatter, {
      dirName,
      description,
      tags,
      providers,
      body,
      repoRoot,
      filePath,
    });

    const result = SkillSchema.safeParse(skillData);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          file: filePath,
          message: `Validation error: ${issue.path.join('.')}: ${issue.message}`,
        });
      }
      return { skill: null, errors, warnings };
    }

    return { skill: result.data, errors, warnings };
  }
}

interface SkillDataParams {
  dirName: string;
  description: string;
  tags: string[];
  providers: string[];
  body: string;
  repoRoot: string;
  filePath: string;
}

function buildSkillData(frontmatter: Record<string, unknown>, params: SkillDataParams) {
  const { dirName, description, tags, providers, body, repoRoot, filePath } = params;
  return {
    name: dirName,
    description,
    ...buildBaseFields(frontmatter),
    ...buildClaudeCodeFields(frontmatter),
    tags,
    providers,
    content: body,
    assets: extractAssets(body),
    sourceRepository: repoRoot,
    sourcePath: filePath,
  };
}

function buildBaseFields(frontmatter: Record<string, unknown>) {
  return {
    license: typeof frontmatter.license === 'string' ? frontmatter.license : undefined,
    compatibility:
      typeof frontmatter.compatibility === 'string' ? frontmatter.compatibility : undefined,
    allowedTools: Array.isArray(frontmatter['allowed-tools'])
      ? frontmatter['allowed-tools'].filter((t: unknown) => typeof t === 'string')
      : undefined,
    metadata:
      typeof frontmatter.metadata === 'object' && frontmatter.metadata !== null
        ? (frontmatter.metadata as Record<string, string>)
        : undefined,
  };
}

function buildClaudeCodeFields(frontmatter: Record<string, unknown>) {
  return {
    whenToUse: typeof frontmatter.when_to_use === 'string' ? frontmatter.when_to_use : undefined,
    argumentHint:
      typeof frontmatter['argument-hint'] === 'string' ? frontmatter['argument-hint'] : undefined,
    arguments: Array.isArray(frontmatter.arguments)
      ? frontmatter.arguments.filter((a: unknown) => typeof a === 'string')
      : undefined,
    disableModelInvocation: frontmatter['disable-model-invocation'] === true,
    userInvocable: frontmatter['user-invocable'] !== false,
    disallowedTools: Array.isArray(frontmatter['disallowed-tools'])
      ? frontmatter['disallowed-tools'].filter((t: unknown) => typeof t === 'string')
      : undefined,
    model: typeof frontmatter.model === 'string' ? frontmatter.model : undefined,
    effort: typeof frontmatter.effort === 'string' ? (frontmatter.effort as string) : undefined,
    context: frontmatter.context === 'fork' ? ('fork' as const) : undefined,
    agent: typeof frontmatter.agent === 'string' ? frontmatter.agent : undefined,
    hooks:
      typeof frontmatter.hooks === 'object' && frontmatter.hooks !== null
        ? (frontmatter.hooks as Record<string, unknown>)
        : undefined,
    paths: Array.isArray(frontmatter.paths)
      ? frontmatter.paths.filter((p: unknown) => typeof p === 'string')
      : undefined,
    shell:
      frontmatter.shell === 'bash' || frontmatter.shell === 'powershell'
        ? frontmatter.shell
        : undefined,
  };
}

function extractFirstParagraph(body: string): string {
  const trimmed = body.trim();
  const lines = trimmed.split('\n');
  for (const line of lines) {
    const cleaned = line.trim();
    if (
      cleaned &&
      !cleaned.startsWith('#') &&
      !cleaned.startsWith('-') &&
      !cleaned.startsWith('*')
    ) {
      return cleaned;
    }
  }
  return '';
}

function deriveTags(
  frontmatter: Record<string, unknown>,
  dirName: string,
  description: string
): string[] {
  const metadata = frontmatter.metadata as Record<string, string> | undefined;
  if (metadata?.tags) {
    return metadata.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const tags: string[] = [dirName];
  const descLower = description.toLowerCase();
  for (const keyword of TAG_TAXONOMY) {
    if (descLower.includes(keyword) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  }
  return tags;
}

function deriveProviders(frontmatter: Record<string, unknown>): string[] {
  const metadata = frontmatter.metadata as Record<string, string> | undefined;
  if (metadata?.providers) {
    return metadata.providers
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  return [];
}

function extractAssets(body: string): string[] {
  const assets: string[] = [];
  const linkRegex = /\(\.\/?(scripts\/[^)]+|references\/[^)]+|assets\/[^)]+)\)/g;
  const matches = [...body.matchAll(linkRegex)];
  for (const match of matches) {
    assets.push(match[1]);
  }
  return [...new Set(assets)];
}

function isPermissionError(err: unknown): boolean {
  if (err instanceof Error) {
    const nodeErr = err as NodeJS.ErrnoException;
    return nodeErr.code === 'EACCES' || nodeErr.code === 'EPERM';
  }
  return false;
}
