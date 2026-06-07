import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { findSkillDirectories, detectRepositoryType } from '../../../src/lib/shared/git-utils';

describe('detectRepositoryType', () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'skillbase-git-utils-'));
    tempDirs.push(dir);
    return dir;
  }

  it('returns standalone for .claude/skills/ at root', () => {
    const root = makeTempDir();
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });

    expect(detectRepositoryType(root)).toBe('standalone');
  });

  it('returns plugin for skills/ at root', () => {
    const root = makeTempDir();
    mkdirSync(join(root, 'skills'), { recursive: true });

    expect(detectRepositoryType(root)).toBe('plugin');
  });

  it('returns multi-plugin for plugins/*/skills/', () => {
    const root = makeTempDir();
    mkdirSync(join(root, 'plugins', 'my-plugin', 'skills'), { recursive: true });

    expect(detectRepositoryType(root)).toBe('multi-plugin');
  });

  it('prefers standalone over plugin when both exist', () => {
    const root = makeTempDir();
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
    mkdirSync(join(root, 'skills'), { recursive: true });

    expect(detectRepositoryType(root)).toBe('standalone');
  });

  it('prefers standalone over multi-plugin when both exist', () => {
    const root = makeTempDir();
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
    mkdirSync(join(root, 'plugins', 'a', 'skills'), { recursive: true });

    expect(detectRepositoryType(root)).toBe('standalone');
  });

  it('returns undefined when no skill directories exist', () => {
    const root = makeTempDir();

    expect(detectRepositoryType(root)).toBeUndefined();
  });
});

describe('findSkillDirectories', () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'skillbase-git-utils-'));
    tempDirs.push(dir);
    return dir;
  }

  it('finds .claude/skills/ directory at repo root', () => {
    const root = makeTempDir();
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toBe(join(root, '.claude', 'skills'));
  });

  it('finds plugins/*/skills/ directories', () => {
    const root = makeTempDir();
    mkdirSync(join(root, 'plugins', 'my-plugin', 'skills'), { recursive: true });

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toBe(join(root, 'plugins', 'my-plugin', 'skills'));
  });

  it('finds both .claude/skills/ and plugins/*/skills/', () => {
    const root = makeTempDir();
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
    mkdirSync(join(root, 'plugins', 'plugin-a', 'skills'), { recursive: true });
    mkdirSync(join(root, 'plugins', 'plugin-b', 'skills'), { recursive: true });

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(3);
    expect(dirs).toContain(join(root, '.claude', 'skills'));
    expect(dirs).toContain(join(root, 'plugins', 'plugin-a', 'skills'));
    expect(dirs).toContain(join(root, 'plugins', 'plugin-b', 'skills'));
  });

  it('returns empty array when no skill directories exist', () => {
    const root = makeTempDir();

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(0);
  });

  it('skips plugin directories without a skills/ subdirectory', () => {
    const root = makeTempDir();
    mkdirSync(join(root, 'plugins', 'empty-plugin'), { recursive: true });

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(0);
  });

  it('finds skills/ at repo root (single-plugin format)', () => {
    const root = makeTempDir();
    mkdirSync(join(root, 'skills'), { recursive: true });
    mkdirSync(join(root, '.claude-plugin'), { recursive: true });

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(1);
    expect(dirs[0]).toBe(join(root, 'skills'));
  });

  it('finds skills/ at root alongside plugins/*/skills/ and .claude/skills/', () => {
    const root = makeTempDir();
    mkdirSync(join(root, 'skills'), { recursive: true });
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
    mkdirSync(join(root, 'plugins', 'a', 'skills'), { recursive: true });

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(3);
  });

  it('skips non-directory entries and only scans plugins/ subdirectories', () => {
    const root = makeTempDir();
    mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
    mkdirSync(join(root, 'plugins', 'real-plugin', 'skills'), { recursive: true });

    const dirs = findSkillDirectories(root);

    expect(dirs).toHaveLength(2);
  });
});
