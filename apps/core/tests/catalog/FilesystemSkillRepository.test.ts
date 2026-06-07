import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FilesystemSkillRepository } from '../../src/lib/catalog/infrastructure/filesystem/FilesystemSkillRepository';

function createTempGitRepo(): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'skillbase-fs-test-'));
  execSync('git init', { cwd: tmpDir });
  execSync('git config user.email "test@skillbase.dev"', { cwd: tmpDir });
  execSync('git config user.name "Test"', { cwd: tmpDir });
  return tmpDir;
}

function writeSkillFile(repoPath: string, skillName: string, content: string): string {
  const skillDir = join(repoPath, '.claude', 'skills', skillName);
  mkdirSync(skillDir, { recursive: true });
  const filePath = join(skillDir, 'SKILL.md');
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function skillFrontmatter(fields: string, body = 'Skill body content.'): string {
  return `---\n${fields}\n---\n\n${body}\n`;
}

describe('FilesystemSkillRepository', () => {
  let repo: FilesystemSkillRepository;
  const tempDirs: string[] = [];

  beforeAll(() => {
    repo = new FilesystemSkillRepository();
  });

  afterAll(() => {
    for (const dir of tempDirs) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  function trackDir(dir: string): string {
    tempDirs.push(dir);
    return dir;
  }

  describe('scanRepository', () => {
    it('parses a valid skill with minimal frontmatter', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'my-skill',
        skillFrontmatter('name: my-skill\ndescription: A test skill')
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('my-skill');
      expect(result.skills[0].description).toBe('A test skill');
      expect(result.skills[0].disableModelInvocation).toBe(false);
      expect(result.skills[0].userInvocable).toBe(true);
      expect(result.skills[0].sourceRepository).toBe(tmpDir);
      expect(result.validationErrors).toHaveLength(0);
    });

    it('parses a skill with all Claude Code extension fields', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'claude-skill',
        skillFrontmatter(
          `name: claude-skill
description: Full Claude Code skill
license: MIT
compatibility: ">=1.0.0"
allowed-tools: ["Read", "Bash"]
when_to_use: When creating commits
argument-hint: "[message]"
arguments: ["message"]
disable-model-invocation: true
user-invocable: false
disallowed-tools: ["Write"]
model: claude-sonnet-4
effort: high
context: fork
agent: Explore
hooks:
  pre: "echo before"
  post: "echo after"
paths:
  - "src/**/*.ts"
shell: bash`
        )
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills).toHaveLength(1);
      const skill = result.skills[0];
      expect(skill.name).toBe('claude-skill');
      expect(skill.description).toBe('Full Claude Code skill');
      expect(skill.license).toBe('MIT');
      expect(skill.compatibility).toBe('>=1.0.0');
      expect(skill.allowedTools).toEqual(['Read', 'Bash']);
      expect(skill.whenToUse).toBe('When creating commits');
      expect(skill.argumentHint).toBe('[message]');
      expect(skill.arguments).toEqual(['message']);
      expect(skill.disableModelInvocation).toBe(true);
      expect(skill.userInvocable).toBe(false);
      expect(skill.disallowedTools).toEqual(['Write']);
      expect(skill.model).toBe('claude-sonnet-4');
      expect(skill.effort).toBe('high');
      expect(skill.context).toBe('fork');
      expect(skill.agent).toBe('Explore');
      expect(skill.hooks).toEqual({ pre: 'echo before', post: 'echo after' });
      expect(skill.paths).toEqual(['src/**/*.ts']);
      expect(skill.shell).toBe('bash');
      expect(skill.content).toBe('Skill body content.\n');
      expect(result.validationErrors).toHaveLength(0);
    });

    it('parses metadata.tags from frontmatter', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'tagged-skill',
        skillFrontmatter(
          `name: tagged-skill
description: Skill with explicit tags
metadata:
  tags: "deploy,security,monitoring"
  providers: "claude-code,opencode"`
        )
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].tags).toEqual(['deploy', 'security', 'monitoring']);
      expect(result.skills[0].providers).toEqual(['claude-code', 'opencode']);
    });

    it('derives tags from directory name and description when metadata.tags absent', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'deploy-tool',
        skillFrontmatter('name: deploy-tool\ndescription: Automates deployment to production')
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills[0].tags).toContain('deploy-tool');
      expect(result.skills[0].tags).toContain('deploy');
      expect(result.skills[0].tags).toContain('deployment');
    });

    it('ignores Claude Code fields in frontmatter — only metadata.providers is used', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'cc-skill',
        skillFrontmatter('name: cc-skill\ndescription: A skill\nmodel: claude-sonnet\neffort: high')
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills[0].providers).toEqual([]);
    });

    it('returns empty providers when no metadata.providers set', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'basic-skill',
        skillFrontmatter('name: basic-skill\ndescription: Just a basic skill\nlicense: MIT')
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills[0].providers).toEqual([]);
    });

    it('ignores directory without SKILL.md and reports warning', () => {
      const tmpDir = trackDir(createTempGitRepo());
      const emptyDir = join(tmpDir, '.claude', 'skills', 'no-skillmd');
      mkdirSync(emptyDir, { recursive: true });

      const result = repo.scanRepository(tmpDir);

      expect(result.skills).toHaveLength(0);
      expect(
        result.warnings.some((w) => w.includes('no-skillmd') && w.includes('no SKILL.md'))
      ).toBe(true);
    });

    it('collects all validation errors for invalid SKILL.md files', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'bad-name',
        '---\nname: BAD_NAME\ndescription: ""\n---\n\n# Heading\n* list item\n'
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills).toHaveLength(0);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('reports name/directory mismatch as validation error', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'dir-name',
        skillFrontmatter('name: different-name\ndescription: Valid description')
      );

      const result = repo.scanRepository(tmpDir);

      expect(
        result.validationErrors.some((e) => e.message.includes('does not match directory name'))
      ).toBe(true);
    });

    it('handles symlinked skill directories', () => {
      const tmpDir = trackDir(createTempGitRepo());
      const actualDir = join(tmpDir, '.claude', 'skills', 'symlinked');
      mkdirSync(actualDir, { recursive: true });
      writeFileSync(
        join(actualDir, 'SKILL.md'),
        skillFrontmatter('name: symlinked\ndescription: From symlink'),
        'utf-8'
      );

      const linkDir = join(tmpDir, '.claude', 'skills', 'linked');
      symlinkSync(actualDir, linkDir, 'dir');

      const result = repo.scanRepository(tmpDir);

      expect(result.skills.length).toBeGreaterThanOrEqual(1);
      const names = result.skills.map((s) => s.name);
      expect(names).toContain('symlinked');
    });

    it('handles large SKILL.md files with warning', () => {
      const tmpDir = trackDir(createTempGitRepo());
      const skillDir = join(tmpDir, '.claude', 'skills', 'large-skill');
      mkdirSync(skillDir, { recursive: true });
      const filePath = join(skillDir, 'SKILL.md');
      const header = '---\nname: large-skill\ndescription: Large file\n---\n\n';
      const buffer = Buffer.alloc(1_100_000, 'a');
      writeFileSync(filePath, Buffer.concat([Buffer.from(header, 'utf-8'), buffer]));

      const result = repo.scanRepository(tmpDir);

      expect(result.warnings.some((w) => w.includes('exceeds 1MB'))).toBe(true);
    });

    it('uses first paragraph of body as description when frontmatter description absent', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'no-desc',
        `---\nname: no-desc\n---\n\nThis is the first paragraph from the body.\n\nSecond paragraph.`
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills[0].description).toBe('This is the first paragraph from the body.');
    });

    it('extracts assets from markdown links in body', () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'with-assets',
        skillFrontmatter(
          'name: with-assets\ndescription: Has assets',
          'Check [the script](./scripts/deploy.sh) and [the ref](./references/api.md).'
        )
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills[0].assets).toContain('scripts/deploy.sh');
      expect(result.skills[0].assets).toContain('references/api.md');
    });

    it('returns empty skills array for non-git directory', () => {
      const tmpDir = trackDir(mkdtempSync(join(tmpdir(), 'skillbase-fs-nogit-')));
      mkdirSync(join(tmpDir, '.claude', 'skills', 'some-skill'), { recursive: true });
      writeFileSync(
        join(tmpDir, '.claude', 'skills', 'some-skill', 'SKILL.md'),
        skillFrontmatter('name: some-skill\ndescription: Test'),
        'utf-8'
      );

      const result = repo.scanRepository(tmpDir);

      expect(result.skills).toHaveLength(0);
      expect(result.validationErrors.some((e) => e.message.includes('Not a git repository'))).toBe(
        true
      );
    });

    it('returns empty skills when no .claude/skills/ directory', () => {
      const tmpDir = trackDir(createTempGitRepo());

      const result = repo.scanRepository(tmpDir);

      expect(result.skills).toHaveLength(0);
      expect(result.validationErrors.some((e) => e.message.includes('no .claude/skills/'))).toBe(
        true
      );
    });
  });

  describe('search', () => {
    it('filters skills by query matching name', async () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'deploy',
        skillFrontmatter('name: deploy\ndescription: Deploy to production')
      );
      writeSkillFile(
        tmpDir,
        'test-runner',
        skillFrontmatter('name: test-runner\ndescription: Run tests')
      );

      const results = await repo.search('deploy', [tmpDir]);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('deploy');
    });

    it('filters skills by query matching description', async () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(
        tmpDir,
        'skill-a',
        skillFrontmatter('name: skill-a\ndescription: Production deployment')
      );

      const results = await repo.search('production', [tmpDir]);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('skill-a');
    });

    it('returns empty array when no match', async () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(tmpDir, 'skill-a', skillFrontmatter('name: skill-a\ndescription: Something'));

      const results = await repo.search('zzznonexistent', [tmpDir]);
      expect(results).toHaveLength(0);
    });

    it('returns all skills for empty query', async () => {
      const tmpDir = trackDir(createTempGitRepo());
      writeSkillFile(tmpDir, 'skill-a', skillFrontmatter('name: skill-a\ndescription: First'));
      writeSkillFile(tmpDir, 'skill-b', skillFrontmatter('name: skill-b\ndescription: Second'));

      const results = await repo.search('', [tmpDir]);
      expect(results).toHaveLength(2);
    });

    it('returns empty array when no repo paths provided', async () => {
      const results = await repo.search('anything');
      expect(results).toHaveLength(0);
    });
  });
});
