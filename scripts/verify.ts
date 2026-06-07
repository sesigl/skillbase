import { execSync } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { resolve } from 'node:path';

const WORKSPACE_ROOT = resolve(import.meta.dirname, '..');

interface PackageInfo {
  name: string;
  path: string;
  dependencies?: Record<string, string>;
}

async function getWorkspacePackages(): Promise<PackageInfo[]> {
  const result = execSync('pnpm ls -r --depth -1 --json', {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf-8',
  });

  return JSON.parse(result).filter((pkg: PackageInfo) => pkg.name !== 'skillbase');
}

async function verifyPackage(
  pkg: PackageInfo
): Promise<{ name: string; success: boolean; output: string }> {
  return new Promise((res) => {
    try {
      const output = execSync('pnpm run verify', {
        cwd: pkg.path,
        encoding: 'utf-8',
        timeout: 120_000,
        env: { ...process.env, CI: 'true' },
      });
      res({ name: pkg.name, success: true, output });
    } catch (e) {
      const output = e instanceof Error ? e.message : String(e);
      res({ name: pkg.name, success: false, output });
    }
  });
}

function runBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  return new Promise((resolveAll, rejectAll) => {
    const results: R[] = [];
    let index = 0;
    let active = 0;

    function next() {
      if (index >= items.length && active === 0) {
        resolveAll(results);
        return;
      }

      while (index < items.length && active < concurrency) {
        const i = index++;
        active++;
        fn(items[i])
          .then((r: R) => {
            results[i] = r;
            active--;
            next();
          })
          .catch(rejectAll);
      }
    }

    next();
  });
}

async function main() {
  const packages = await getWorkspacePackages();
  const concurrency = availableParallelism();

  const rootChecks = [
    { name: 'root:format', command: 'pnpm biome format .', cwd: WORKSPACE_ROOT },
    { name: 'root:lint', command: 'pnpm biome lint .', cwd: WORKSPACE_ROOT },
    {
      name: 'root:design-system',
      command: 'tsx scripts/checks/design-system.ts',
      cwd: WORKSPACE_ROOT,
    },
  ];

  let failed = 0;
  const allResults: { name: string; status: string }[] = [];

  for (const check of rootChecks) {
    try {
      execSync(check.command, { cwd: check.cwd, encoding: 'utf-8', timeout: 30_000 });
      allResults.push({ name: check.name, status: 'PASS' });
    } catch (_e) {
      allResults.push({ name: check.name, status: 'FAIL' });
      failed++;
    }
  }

  const packageResults = await runBatches(packages, verifyPackage, concurrency);
  for (const result of packageResults) {
    if (!result.success) failed++;
    allResults.push({ name: result.name, status: result.success ? 'PASS' : 'FAIL' });
  }

  console.log('\n--- Verify Results ---');
  for (const r of allResults) {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}`);
  }

  if (failed > 0) {
    console.log(`\n${failed} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('\nAll checks passed.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
