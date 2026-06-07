import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  file: string;
  message: string;
}

interface RequiredRule {
  name: string;
  pattern: RegExp;
}

const APP_DIR = path.resolve(import.meta.dirname, '..', '..');
const LIB_DIR = path.join(APP_DIR, 'src', 'lib');

const REQUIRED_RULES: RequiredRule[] = [
  { name: 'orchestration-only rule', pattern: /orchestration only/i },
  {
    name: 'use case coordination guidance',
    pattern: /use case methods?.*coordinate.*domain ports.*domain objects/is,
  },
  { name: 'transaction boundary exception', pattern: /transaction boundaries/i },
  { name: 'message publishing exception', pattern: /publishing messages/i },
  {
    name: 'domain logic exclusion',
    pattern: /domain decisions.*validation rules.*derivation rules.*parsing logic/is,
  },
  {
    name: 'infrastructure and adapter exclusion',
    pattern: /filesystem.*database.*HTTP.*framework.*URL encoding.*rendering/is,
  },
  { name: 'direct infrastructure import exclusion', pattern: /direct infrastructure imports/i },
  {
    name: 'move behavior out of application guidance',
    pattern: /move.*domain.*infrastructure adapter/is,
  },
];

function rel(filePath: string): string {
  return path.relative(APP_DIR, filePath);
}

function discoverApplicationDirs(): string[] {
  if (!fs.existsSync(LIB_DIR)) return [];

  return fs
    .readdirSync(LIB_DIR)
    .map((entry) => path.join(LIB_DIR, entry, 'application'))
    .filter((applicationDir) =>
      fs.existsSync(applicationDir) ? fs.statSync(applicationDir).isDirectory() : false
    );
}

function checkApplicationAgents(applicationDir: string): Violation[] {
  const agentsPath = path.join(applicationDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    return [
      {
        file: rel(applicationDir),
        message: 'Application layer folders must contain AGENTS.md with layer usage rules.',
      },
    ];
  }

  const content = fs.readFileSync(agentsPath, 'utf-8');

  return REQUIRED_RULES.filter((rule) => !rule.pattern.test(content)).map((rule) => ({
    file: rel(agentsPath),
    message: `AGENTS.md is missing required guidance: ${rule.name}.`,
  }));
}

const violations = discoverApplicationDirs().flatMap(checkApplicationAgents);

if (violations.length > 0) {
  console.error(`\nApplication AGENTS.md violations found (${violations.length}):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    ${v.message}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('Application AGENTS.md checks passed');
}
