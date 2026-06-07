import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  file: string;
  line: number;
  match: string;
}

const APP_DIR = path.resolve(import.meta.dirname, '..', '..');

function rel(filePath: string): string {
  return path.relative(APP_DIR, filePath);
}

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

const DYNAMIC_IMPORT_PATTERN = /import\(/;

const VALUE_IMPORT_PATTERNS = [
  /await\s+import\(/,
  /=\s+import\(/,
  /=\s+await\s+import\(/,
  /const\s+.*import\(/,
  /let\s+.*import\(/,
  /var\s+.*import\(/,
  /return\s+import\(/,
  /Promise<.*import\(/,
  /import\s*\(\s*['"][^'"]+['"]\s*\)\s*\(/, // Dynamic import followed by call: import('x')()
];

function isDynamicValueImport(line: string): boolean {
  return VALUE_IMPORT_PATTERNS.some((pattern) => pattern.test(line));
}

const srcDir = path.resolve(APP_DIR, 'src');
const files = collectFiles(srcDir, ['.ts', '.tsx']);

const violations: Violation[] = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!DYNAMIC_IMPORT_PATTERN.test(lines[i])) continue;
    if (isDynamicValueImport(lines[i])) continue;

    violations.push({
      file: rel(file),
      line: i + 1,
      match: lines[i].trim(),
    });
  }
}

if (violations.length > 0) {
  console.error(
    `\nFound ${violations.length} inline import type(s).\n` +
      '  Move the import to the top-level of the file.\n'
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.match}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('No inline import types found');
}
