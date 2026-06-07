import { type Dirent, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export function findGitRoot(startPath: string): string | null {
  let current = resolve(startPath);

  for (let i = 0; i < 64; i++) {
    const gitPath = join(current, '.git');
    try {
      statSync(gitPath);
      return current;
    } catch {
      const parent = dirname(current);
      if (parent === current) return null;
      current = parent;
    }
  }

  return null;
}

export function pathExists(absPath: string): boolean {
  try {
    statSync(absPath);
    return true;
  } catch {
    return false;
  }
}

export function findSkillDirectories(repoRoot: string): string[] {
  const dirs: string[] = [];

  const claudeSkillsDir = join(repoRoot, '.claude', 'skills');
  if (isDirectory(claudeSkillsDir)) {
    dirs.push(claudeSkillsDir);
  }

  const rootSkillsDir = join(repoRoot, 'skills');
  if (isDirectory(rootSkillsDir)) {
    dirs.push(rootSkillsDir);
  }

  const pluginsDir = join(repoRoot, 'plugins');
  if (isDirectory(pluginsDir)) {
    let pluginEntries: Dirent[];
    try {
      pluginEntries = readdirSync(pluginsDir, { withFileTypes: true });
    } catch {
      pluginEntries = [];
    }
    for (const entry of pluginEntries) {
      if (!entry.isDirectory()) continue;
      const pluginSkillsDir = join(pluginsDir, entry.name, 'skills');
      if (isDirectory(pluginSkillsDir)) {
        dirs.push(pluginSkillsDir);
      }
    }
  }

  return dirs;
}

function isDirectory(absPath: string): boolean {
  try {
    return statSync(absPath).isDirectory();
  } catch {
    return false;
  }
}
