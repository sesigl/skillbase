import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  file: string;
  message: string;
}

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const APPS = [
  { name: 'core', dir: path.join(ROOT, 'apps', 'core') },
  { name: 'landing-page', dir: path.join(ROOT, 'apps', 'landing-page') },
];

const violations: Violation[] = [];

function rel(filePath: string): string {
  return path.relative(ROOT, filePath);
}

function fileExists(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isFile();
}

function readFile(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

// --- 1. design-tokens.css exists ---
for (const app of APPS) {
  const tokensFile = path.join(app.dir, 'src', 'styles', 'design-tokens.css');
  if (!fileExists(tokensFile)) {
    violations.push({
      file: rel(tokensFile),
      message: `${app.name}: missing src/styles/design-tokens.css`,
    });
  }
}

// --- 2. global.css imports design-tokens.css ---
for (const app of APPS) {
  const globalCss = path.join(app.dir, 'src', 'styles', 'global.css');
  if (!fileExists(globalCss)) continue;
  const content = readFile(globalCss);
  if (!content.includes('design-tokens.css')) {
    violations.push({
      file: rel(globalCss),
      message: `${app.name}: global.css does not import design-tokens.css`,
    });
  }
}

// --- 3. No inline <style> blocks with duplicated tokens in .astro files ---
const FORBIDDEN_INLINE_TOKENS = ['--paper:', '--stone-', '--lime-', '--ink:'];
const STYLE_BLOCK_RE = /<style[^>]*>([\s\S]*?)<\/style>/g;

function hasForbiddenTokenInStyleBlocks(content: string): string | null {
  for (const match of content.matchAll(STYLE_BLOCK_RE)) {
    for (const token of FORBIDDEN_INLINE_TOKENS) {
      if (match[1].includes(token)) return token;
    }
  }
  return null;
}

for (const app of APPS) {
  const srcDir = path.join(app.dir, 'src');
  if (!fs.existsSync(srcDir)) continue;

  function walkAstro(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkAstro(fullPath);
      } else if (entry.name.endsWith('.astro')) {
        const content = readFile(fullPath);
        const token = hasForbiddenTokenInStyleBlocks(content);
        if (token) {
          violations.push({
            file: rel(fullPath),
            message: `${app.name}: inline <style> block with duplicated design token "${token}". Remove the inline block — imported from design-tokens.css.`,
          });
        }
      }
    }
  }

  walkAstro(srcDir);
}

// --- 4. Core app BaseLayout has data-theme="dark" on <body> ---
{
  const coreLayout = path.join(ROOT, 'apps', 'core', 'src', 'layouts', 'BaseLayout.astro');
  if (fileExists(coreLayout)) {
    const content = readFile(coreLayout);
    if (!content.includes('data-theme="dark"')) {
      violations.push({
        file: rel(coreLayout),
        message:
          'core: BaseLayout.astro body missing data-theme="dark". Core app must use dark shell.',
      });
    }
  }
}

// --- 5. tailwind.config.mjs maps design tokens (spot-check key tokens) ---
const REQUIRED_TW_CONFIG_TOKENS = ['bg-sunk', 'accent-hover', 'code-bg', 'border-strong'];

for (const app of APPS) {
  const twConfig = path.join(app.dir, 'tailwind.config.mjs');
  if (!fileExists(twConfig)) {
    violations.push({
      file: rel(twConfig),
      message: `${app.name}: missing tailwind.config.mjs`,
    });
    continue;
  }
  const content = readFile(twConfig);
  for (const token of REQUIRED_TW_CONFIG_TOKENS) {
    if (!content.includes(`'${token}'`)) {
      violations.push({
        file: rel(twConfig),
        message: `${app.name}: tailwind.config.mjs missing color mapping for "${token}"`,
      });
    }
  }
}

// --- Report ---
if (violations.length > 0) {
  console.error(`\nDesign system violations found (${violations.length}):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}`);
    console.error(`    ${v.message}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('Design system checks passed');
}
