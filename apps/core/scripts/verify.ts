import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';

interface TaskResult {
  name: string;
  exitCode: number;
  output: string;
  durationMs: number;
}

const TASK_SETS: Record<string, string[]> = {
  review: [
    'format:check',
    'lint',
    'ls-lint',
    'knip',
    'astro:check',
    'test:arch',
    'check:ast-grep',
    'check:architecture',
    'check:env-imports',
    'check:migrations',
    'check:use-case-tests',
    'check:no-inline-imports',
    'check:application-agents',
  ],
  qa: ['test'],
  verify: [
    'format:check',
    'lint',
    'ls-lint',
    'knip',
    'astro:check',
    'test:arch',
    'check:ast-grep',
    'check:architecture',
    'check:env-imports',
    'check:migrations',
    'check:use-case-tests',
    'check:no-inline-imports',
    'check:application-agents',
    'test',
  ],
};

function resolveTasks(): string[] {
  const setName = process.env.TASK_SET ?? 'verify';
  const tasks = TASK_SETS[setName];
  if (!tasks) {
    console.error(
      `Unknown TASK_SET: "${setName}". Valid values: ${Object.keys(TASK_SETS).join(', ')}`
    );
    process.exit(1);
  }
  return tasks;
}

function parseMaxParallel(): number {
  const envValue = process.env.VERIFY_MAX_PARALLEL;
  const argIndex = process.argv.indexOf('--max-parallel');
  const argValue = argIndex !== -1 ? process.argv[argIndex + 1] : undefined;

  const raw = argValue ?? envValue;
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      console.error(`Invalid --max-parallel value: "${raw}". Must be a positive integer.`);
      process.exit(1);
    }
    return parsed;
  }

  return availableParallelism();
}

function runTask(name: string): Promise<TaskResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const chunks: string[] = [];

    const child = spawn('npm', ['run', name], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    child.stdout.on('data', (data: Buffer) => chunks.push(data.toString()));
    child.stderr.on('data', (data: Buffer) => chunks.push(data.toString()));

    child.on('close', (code) => {
      const durationMs = Date.now() - start;
      const icon = code === 0 ? '\u2713' : '\u2717';
      const duration = `${(durationMs / 1000).toFixed(1)}s`;
      console.log(`  ${icon} ${name} (${duration})`);

      resolve({
        name,
        exitCode: code ?? 1,
        output: chunks.join(''),
        durationMs,
      });
    });
  });
}

async function runWithConcurrencyLimit(
  tasks: string[],
  maxParallel: number
): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  let taskIndex = 0;

  async function worker(): Promise<void> {
    while (taskIndex < tasks.length) {
      const currentIndex = taskIndex;
      taskIndex++;
      const result = await runTask(tasks[currentIndex]);
      results.push(result);
    }
  }

  const workerCount = Math.min(maxParallel, tasks.length);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  return results;
}

async function main(): Promise<void> {
  const tasks = resolveTasks();
  const maxParallel = parseMaxParallel();
  const setName = process.env.TASK_SET ?? 'verify';

  console.log(`\n${setName}: running ${tasks.length} tasks (max ${maxParallel} parallel)\n`);

  const overallStart = Date.now();
  const results = await runWithConcurrencyLimit(tasks, maxParallel);
  const overallDuration = ((Date.now() - overallStart) / 1000).toFixed(1);

  const failures = results.filter((r) => r.exitCode !== 0);

  console.log('');

  if (failures.length > 0) {
    console.log(`--- Failed tasks (${failures.length}) ---\n`);
    for (const failure of failures) {
      console.log(`=== ${failure.name} (exit ${failure.exitCode}) ===`);
      console.log(failure.output.trim());
      console.log('');
    }
  }

  const passed = results.length - failures.length;
  console.log(
    `${setName} completed in ${overallDuration}s: ${passed} passed, ${failures.length} failed`
  );

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
