import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  file: string;
  message: string;
}

const APP_DIR = path.resolve(import.meta.dirname, '..', '..');
const TESTS_DIR = path.join(APP_DIR, 'tests');

const violations: Violation[] = [];

function rel(filePath: string): string {
  return path.relative(APP_DIR, filePath);
}

const USECASE_IMPORT_RE =
  /import\s+.*?from\s+['"]((?:\.\.\/)+src\/lib\/(.+?))\/(application\/([A-Z]\w*UseCases?)|infrastructure\/di)['"]/g;

const IMPLEMENTS_REPO_RE = /implements\s+\w+Repository/g;

function walkTestFiles(dir: string, fn: (filePath: string, content: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTestFiles(fullPath, fn);
    } else if (entry.name.endsWith('.test.ts')) {
      fn(fullPath, fs.readFileSync(fullPath, 'utf-8'));
    }
  }
}

function checkImplementsRepository(filePath: string, content: string): void {
  IMPLEMENTS_REPO_RE.lastIndex = 0;
  if (IMPLEMENTS_REPO_RE.test(content)) {
    violations.push({
      file: rel(filePath),
      message:
        'Application test should not use mocks (implements *Repository). Use real Postgres repositories with Testcontainers.',
    });
  }
}

function checkUseCasePath(filePath: string, content: string): void {
  USECASE_IMPORT_RE.lastIndex = 0;

  let match = USECASE_IMPORT_RE.exec(content);
  while (match !== null) {
    const modulePath = match[2];
    const isUseCaseImport = Boolean(match[4]);

    if (isUseCaseImport) {
      const useCaseName = match[4];
      const expectedTestFile = path.join(
        APP_DIR,
        'tests',
        'lib',
        modulePath,
        'application',
        `${useCaseName}.test.ts`
      );

      if (filePath !== expectedTestFile) {
        violations.push({
          file: rel(filePath),
          message: `Test path must mirror the source structure. Expected: ${rel(expectedTestFile)}`,
        });
        return;
      }
    } else {
      const testRelPath = path.relative(APP_DIR, filePath);
      const modulePrefix = `tests/lib/${modulePath}/application/`;

      if (!testRelPath.startsWith(modulePrefix)) {
        violations.push({
          file: rel(filePath),
          message: `Test importing from ${modulePath}/infrastructure/di must live in ${modulePrefix}`,
        });
        return;
      }

      if (!path.basename(filePath).endsWith('UseCases.test.ts')) {
        violations.push({
          file: rel(filePath),
          message: `Test importing from ${modulePath}/infrastructure/di must follow naming convention: *UseCases.test.ts`,
        });
        return;
      }
    }

    match = USECASE_IMPORT_RE.exec(content);
  }
}

walkTestFiles(TESTS_DIR, (filePath, content) => {
  checkUseCasePath(filePath, content);
  if (filePath.includes('/application/')) {
    checkImplementsRepository(filePath, content);
  }
});

if (violations.length > 0) {
  console.error(`\nUseCase test structure violations found (${violations.length}):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    ${v.message}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('UseCase test structure checks passed');
}
