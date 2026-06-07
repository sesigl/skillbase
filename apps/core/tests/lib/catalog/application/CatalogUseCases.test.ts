import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCatalogUseCases } from '../../../../src/lib/catalog/infrastructure/di';

function createTempGitRepo(): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'skillbase-test-'));
  execSync('git init', { cwd: tmpDir });
  execSync('git config user.email "test@skillbase.dev"', { cwd: tmpDir });
  execSync('git config user.name "Test"', { cwd: tmpDir });
  return tmpDir;
}

function writeSkillMarkdown(
  repoPath: string,
  skillName: string,
  frontmatter: string,
  body = 'Skill content here.'
): void {
  const skillDir = join(repoPath, '.claude', 'skills', skillName);
  mkdirSync(skillDir, { recursive: true });
  const content = `---\n${frontmatter}\n---\n\n${body}\n`;
  writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

describe('CatalogUseCases', () => {
  let useCases: ReturnType<typeof createCatalogUseCases>;
  const tempDirs: string[] = [];

  beforeAll(() => {
    useCases = createCatalogUseCases();
  });

  afterAll(() => {
    for (const dir of tempDirs) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  function trackTempDir(dir: string): string {
    tempDirs.push(dir);
    return dir;
  }

  describe('indexRepository', () => {
    it('rejects a path that does not exist', async () => {
      const result = await useCases.indexRepository('/tmp/definitely-does-not-exist-12345');

      expect(result.status).toBe('invalid');
      expect(result.skills).toHaveLength(0);
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors[0].message).toContain('Path does not exist');
    });

    it('rejects a path that is not a git repository', async () => {
      const tmpDir = trackTempDir(mkdtempSync(join(tmpdir(), 'skillbase-test-')));
      mkdirSync(join(tmpDir, '.claude', 'skills'), { recursive: true });

      const result = await useCases.indexRepository(tmpDir);

      expect(result.status).toBe('invalid');
      expect(result.skills).toHaveLength(0);
      expect(result.validationErrors.some((e) => e.message.includes('Not a git repository'))).toBe(
        true
      );
    });

    it('rejects a git repo with no .claude/skills/ directory', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());

      const result = await useCases.indexRepository(tmpDir);

      expect(result.status).toBe('invalid');
      expect(result.skills).toHaveLength(0);
      expect(result.validationErrors.some((e) => e.message.includes('No skills found'))).toBe(true);
    });

    it('rejects a git repo with .claude/skills/ but no SKILL.md files', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      mkdirSync(join(tmpDir, '.claude', 'skills'), { recursive: true });

      const result = await useCases.indexRepository(tmpDir);

      expect(result.status).toBe('invalid');
      expect(result.skills).toHaveLength(0);
      expect(result.validationErrors.some((e) => e.message.includes('no SKILL.md files'))).toBe(
        true
      );
    });

    it('indexes a valid git repo with a single skill', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(
        tmpDir,
        'git-conventions',
        'name: git-conventions\ndescription: Enforce Conventional Commits'
      );

      const result = await useCases.indexRepository(tmpDir);

      expect(result.status).toBe('valid');
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe('git-conventions');
      expect(result.skills[0].description).toBe('Enforce Conventional Commits');
      expect(result.skills[0].sourceRepository).toBe(tmpDir);
      expect(result.skills[0].sourcePath).toBe(
        join(tmpDir, '.claude', 'skills', 'git-conventions', 'SKILL.md')
      );
      expect(result.validationErrors).toHaveLength(0);
    });

    it('indexes a repo with multiple skills', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'skill-a', 'name: skill-a\ndescription: First skill');
      writeSkillMarkdown(tmpDir, 'skill-b', 'name: skill-b\ndescription: Second skill');

      const result = await useCases.indexRepository(tmpDir);

      expect(result.status).toBe('valid');
      expect(result.skills).toHaveLength(2);
    });

    it('collects all validation errors for invalid SKILL.md files', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'broken-1', 'name: broken-1\ndescription: ""');
      writeSkillMarkdown(
        tmpDir,
        'broken-2',
        'name: BROKEN\ndescription: Valid desc but invalid name'
      );

      const result = await useCases.indexRepository(tmpDir);

      expect(result.status).toBe('invalid');
      expect(result.validationErrors.length).toBeGreaterThanOrEqual(1);
    });

    it('re-indexing the same path replaces existing skills', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'original', 'name: original\ndescription: Original skill');

      const first = await useCases.indexRepository(tmpDir);
      expect(first.skills).toHaveLength(1);

      rmSync(join(tmpDir, '.claude', 'skills', 'original'), { recursive: true, force: true });
      writeSkillMarkdown(tmpDir, 'updated', 'name: updated\ndescription: Updated skill');

      const second = await useCases.indexRepository(tmpDir);
      expect(second.skills).toHaveLength(1);
      expect(second.skills[0].name).toBe('updated');
    });

    it('parses the markdown body after frontmatter as content', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(
        tmpDir,
        'content-skill',
        'name: content-skill\ndescription: Test body extraction',
        '# Heading\n\nSome body text.'
      );

      const result = await useCases.indexRepository(tmpDir);

      expect(result.skills[0].content).toContain('# Heading');
      expect(result.skills[0].content).toContain('Some body text');
    });
  });

  describe('browseSkills', () => {
    it('returns skills from a single indexed repository', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'skill-a', 'name: skill-a\ndescription: First skill');

      await useCases.indexRepository(tmpDir);
      const skills = await useCases.browseSkills();

      expect(skills.length).toBeGreaterThanOrEqual(1);
      expect(skills.some((s) => s.name === 'skill-a')).toBe(true);
    });

    it('combines skills from multiple indexed repositories', async () => {
      const tmpDir1 = trackTempDir(createTempGitRepo());
      const tmpDir2 = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir1, 'skill-a', 'name: skill-a\ndescription: First');
      writeSkillMarkdown(tmpDir2, 'skill-b', 'name: skill-b\ndescription: Second');

      await useCases.indexRepository(tmpDir1);
      await useCases.indexRepository(tmpDir2);
      const skills = await useCases.browseSkills();

      expect(skills.some((s) => s.name === 'skill-a')).toBe(true);
      expect(skills.some((s) => s.name === 'skill-b')).toBe(true);
    });
  });

  describe('searchSkills', () => {
    it('searches by name (case-insensitive)', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'deploy-tool', 'name: deploy-tool\ndescription: Some description');

      await useCases.indexRepository(tmpDir);
      const results = await useCases.searchSkills('DEPLOY');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('deploy-tool');
    });

    it('searches by description', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'skill-a', 'name: skill-a\ndescription: Production deployment');

      await useCases.indexRepository(tmpDir);
      const results = await useCases.searchSkills('production');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('skill-a');
    });

    it('returns empty array when no match', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'skill-a', 'name: skill-a\ndescription: Something');

      await useCases.indexRepository(tmpDir);
      const results = await useCases.searchSkills('zzznonexistent');

      expect(results).toHaveLength(0);
    });

    it('returns all skills for empty query', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'a', 'name: a\ndescription: First');
      writeSkillMarkdown(tmpDir, 'b', 'name: b\ndescription: Second');

      await useCases.indexRepository(tmpDir);
      const results = await useCases.searchSkills('');

      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('listRepositories', () => {
    it('returns indexed repositories with valid status', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'a-skill', 'name: a-skill\ndescription: Test');

      await useCases.indexRepository(tmpDir);
      const repos = await useCases.listRepositories();

      const found = repos.find((r) => r.path === tmpDir);
      expect(found).toBeDefined();
      expect(found?.lastStatus).toBe('valid');
      expect(found?.indexedAt).toBeInstanceOf(Date);
    });

    it('reports missing status for deleted paths', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'gone-skill', 'name: gone-skill\ndescription: Will be deleted');

      await useCases.indexRepository(tmpDir);
      rmSync(tmpDir, { recursive: true, force: true });

      const repos = await useCases.listRepositories();
      const found = repos.find((r) => r.path === tmpDir);
      expect(found?.lastStatus).toBe('missing');
      tempDirs.splice(tempDirs.indexOf(tmpDir), 1);
    });
  });

  describe('removeRepository', () => {
    it('removes an indexed repository', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'removable', 'name: removable\ndescription: Removable skill');

      await useCases.indexRepository(tmpDir);
      await useCases.removeRepository(tmpDir);

      const repos = await useCases.listRepositories();
      expect(repos.some((r) => r.path === tmpDir)).toBe(false);
    });

    it('does not throw for non-indexed path', async () => {
      await expect(
        useCases.removeRepository('/tmp/definitely-not-indexed')
      ).resolves.toBeUndefined();
    });
  });

  describe('clearAll', () => {
    it('clears all indexed repositories', async () => {
      const tmpDir = trackTempDir(createTempGitRepo());
      writeSkillMarkdown(tmpDir, 'cleared', 'name: cleared\ndescription: To be cleared');

      await useCases.indexRepository(tmpDir);
      await useCases.clearAll();

      const repos = await useCases.listRepositories();
      expect(repos).toHaveLength(0);
    });

    it('is a no-op when registry is empty', async () => {
      await useCases.clearAll();

      const repos = await useCases.listRepositories();
      expect(repos).toHaveLength(0);
    });
  });
});
