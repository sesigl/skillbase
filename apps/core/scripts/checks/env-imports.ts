import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  file: string;
  line: number;
  match: string;
}

const ALLOWED_BUILTINS = ['import.meta.env.PROD', 'import.meta.env.DEV', 'import.meta.env.SSR'];
const IMPORT_META_ENV_PATTERN = /import\.meta\.env\.\w+/g;

function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

function rel(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

const srcDir = path.resolve(process.cwd(), 'src');
const files = collectFiles(srcDir, ['.ts', '.tsx']);

const violations: Violation[] = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const matches = lines[i].matchAll(IMPORT_META_ENV_PATTERN);
    for (const match of matches) {
      if (!ALLOWED_BUILTINS.includes(match[0])) {
        violations.push({ file: rel(file), line: i + 1, match: match[0] });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `\nFound ${violations.length} forbidden import.meta.env usage(s).\n` +
      '  Use `import { VAR } from "astro:env/server"` instead.\n'
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.match}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('No forbidden import.meta.env usage found');
}
