import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  check: string;
  message: string;
}

const MIGRATIONS_PATH = path.join(process.cwd(), 'migrations');
const SQLS_PATH = path.join(MIGRATIONS_PATH, 'sqls');

function extractTimestamp(filename: string): string | null {
  const match = filename.match(/^(\d{14})-/);
  return match ? match[1] : null;
}

function extractMigrationName(sqlFilename: string): string | null {
  const match = sqlFilename.match(/^(\d{14}-[a-z0-9-]+)-(up|down)\.sql$/);
  return match ? match[1] : null;
}

function checkMigrationJsWrappers(): Violation[] {
  const violations: Violation[] = [];

  if (!fs.existsSync(SQLS_PATH)) {
    return violations;
  }

  const sqlFiles = fs.readdirSync(SQLS_PATH).filter((f) => f.endsWith('-up.sql'));
  const jsFiles = new Set(
    fs
      .readdirSync(MIGRATIONS_PATH)
      .filter((f) => f.endsWith('.js'))
      .map((f) => f.replace('.js', ''))
  );

  for (const sqlFile of sqlFiles) {
    const migrationName = extractMigrationName(sqlFile);
    if (!migrationName) continue;

    if (!jsFiles.has(migrationName)) {
      violations.push({
        check: 'migration-js-wrapper',
        message: `migrations/sqls/${sqlFile} has no JS wrapper file. Expected: migrations/${migrationName}.js`,
      });
    }
  }

  return violations;
}

function checkMigrationSqlFiles(): Violation[] {
  const violations: Violation[] = [];

  if (!fs.existsSync(MIGRATIONS_PATH)) {
    return violations;
  }

  const jsFiles = fs.readdirSync(MIGRATIONS_PATH).filter((f) => f.endsWith('.js'));
  const sqlFiles = new Set(fs.existsSync(SQLS_PATH) ? fs.readdirSync(SQLS_PATH) : []);

  for (const jsFile of jsFiles) {
    const migrationName = jsFile.replace('.js', '');
    const timestamp = extractTimestamp(migrationName);
    if (!timestamp) continue;

    const expectedUpSql = `${migrationName}-up.sql`;
    const expectedDownSql = `${migrationName}-down.sql`;

    if (!sqlFiles.has(expectedUpSql)) {
      violations.push({
        check: 'migration-sql-files',
        message: `migrations/${jsFile} missing up SQL file. Expected: migrations/sqls/${expectedUpSql}`,
      });
    }

    if (!sqlFiles.has(expectedDownSql)) {
      violations.push({
        check: 'migration-sql-files',
        message: `migrations/${jsFile} missing down SQL file. Expected: migrations/sqls/${expectedDownSql}`,
      });
    }
  }

  return violations;
}

function checkMigrationJsReferences(): Violation[] {
  const violations: Violation[] = [];

  if (!fs.existsSync(MIGRATIONS_PATH)) {
    return violations;
  }

  const jsFiles = fs.readdirSync(MIGRATIONS_PATH).filter((f) => f.endsWith('.js'));

  for (const jsFile of jsFiles) {
    const migrationName = jsFile.replace('.js', '');
    const jsPath = path.join(MIGRATIONS_PATH, jsFile);
    const content = fs.readFileSync(jsPath, 'utf-8');

    const expectedUpSql = `${migrationName}-up.sql`;
    const expectedDownSql = `${migrationName}-down.sql`;

    if (!content.includes(expectedUpSql)) {
      violations.push({
        check: 'migration-js-references',
        message: `migrations/${jsFile} does not reference "${expectedUpSql}" in up() function.`,
      });
    }

    if (!content.includes(expectedDownSql)) {
      violations.push({
        check: 'migration-js-references',
        message: `migrations/${jsFile} does not reference "${expectedDownSql}" in down() function.`,
      });
    }
  }

  return violations;
}

function main(): void {
  const allViolations = [
    ...checkMigrationJsWrappers(),
    ...checkMigrationSqlFiles(),
    ...checkMigrationJsReferences(),
  ];

  if (allViolations.length > 0) {
    const grouped = new Map<string, Violation[]>();
    for (const v of allViolations) {
      const list = grouped.get(v.check) ?? [];
      list.push(v);
      grouped.set(v.check, list);
    }

    console.error('Migration Check FAILED\n');

    for (const [check, violations] of grouped) {
      console.error(`--- ${check} (${violations.length}) ---\n`);
      for (const v of violations) {
        console.error(`  ${v.message}\n`);
      }
    }

    console.error(`Found ${allViolations.length} violation(s) across ${grouped.size} check(s).`);
    process.exit(1);
  }

  const sqlFiles = fs.existsSync(SQLS_PATH)
    ? fs.readdirSync(SQLS_PATH).filter((f) => f.endsWith('-up.sql')).length
    : 0;
  const jsFiles = fs.existsSync(MIGRATIONS_PATH)
    ? fs.readdirSync(MIGRATIONS_PATH).filter((f) => f.endsWith('.js')).length
    : 0;

  console.log('Migration Check PASSED');
  console.log(`Checked ${jsFiles} JS wrapper(s) and ${sqlFiles} SQL migration(s)`);
}

main();
