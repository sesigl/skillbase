import * as fs from 'node:fs';
import * as path from 'node:path';

interface Violation {
  check: string;
  message: string;
}

interface BoundedContext {
  name: string;
  path: string;
  hasDomain: boolean;
  hasInfrastructure: boolean;
}

function discoverBoundedContexts(libPath: string): BoundedContext[] {
  if (!fs.existsSync(libPath)) {
    return [];
  }

  return fs
    .readdirSync(libPath)
    .filter((name) => fs.statSync(path.join(libPath, name)).isDirectory())
    .map((name) => {
      const contextPath = path.join(libPath, name);
      return {
        name,
        path: contextPath,
        hasDomain: fs.existsSync(path.join(contextPath, 'domain')),
        hasInfrastructure: fs.existsSync(path.join(contextPath, 'infrastructure')),
      };
    });
}

function checkDomainStructure(contexts: BoundedContext[]): Violation[] {
  const violations: Violation[] = [];

  for (const ctx of contexts) {
    if (!ctx.hasDomain) continue;

    const domainPath = path.join(ctx.path, 'domain');
    const items = fs.readdirSync(domainPath);
    const hasSubfolders = items.some((item) =>
      fs.statSync(path.join(domainPath, item)).isDirectory()
    );

    if (!hasSubfolders && items.length > 0) {
      violations.push({
        check: 'domain-structure',
        message: `[${ctx.name}] domain/ has no subfolders. Files must be grouped into concept subfolders (e.g., domain/<aggregate>/, domain/ports/).`,
      });
    }
  }

  return violations;
}

function checkDomainAggregateFolders(contexts: BoundedContext[]): Violation[] {
  const violations: Violation[] = [];

  for (const ctx of contexts) {
    if (!ctx.hasDomain) continue;

    const domainPath = path.join(ctx.path, 'domain');

    for (const item of fs.readdirSync(domainPath)) {
      if (fs.statSync(path.join(domainPath, item)).isFile()) {
        violations.push({
          check: 'domain-aggregate-folders',
          message: `[${ctx.name}] ${path.relative(process.cwd(), path.join(domainPath, item))} — must be moved into an aggregate root subfolder.`,
        });
      }
    }
  }

  return violations;
}

const ALLOWED_INFRASTRUCTURE_ROOT_FILES = ['di.ts'];

function checkInfrastructureStructure(contexts: BoundedContext[]): Violation[] {
  const violations: Violation[] = [];

  for (const ctx of contexts) {
    if (!ctx.hasInfrastructure) continue;

    const infraPath = path.join(ctx.path, 'infrastructure');

    for (const item of fs.readdirSync(infraPath)) {
      const isFile = fs.statSync(path.join(infraPath, item)).isFile();
      if (isFile && !ALLOWED_INFRASTRUCTURE_ROOT_FILES.includes(item)) {
        violations.push({
          check: 'infrastructure-structure',
          message: `[${ctx.name}] ${path.relative(process.cwd(), path.join(infraPath, item))} — only ${ALLOWED_INFRASTRUCTURE_ROOT_FILES.join(', ')} allowed at infrastructure/ root. Move to a subfolder (e.g., persistence/, adapters/).`,
        });
      }
    }
  }

  return violations;
}

const FUNCTION_IN_FRONTMATTER_PATTERN = /^\s*function\s+(\w+)\s*\(/;

function collectAstroFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectAstroFiles(fullPath));
    } else if (entry.name.endsWith('.astro')) {
      results.push(fullPath);
    }
  }

  return results;
}

function extractFrontmatterLines(fileContent: string): { text: string; lineNumber: number }[] {
  const lines = fileContent.split('\n');
  const frontmatterLines: { text: string; lineNumber: number }[] = [];
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      }
      break;
    }

    if (inFrontmatter) {
      frontmatterLines.push({ text: lines[i], lineNumber: i + 1 });
    }
  }

  return frontmatterLines;
}

function checkPresentationLogic(pagesPath: string): Violation[] {
  const violations: Violation[] = [];

  for (const file of collectAstroFiles(pagesPath)) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);

    for (const { text, lineNumber } of extractFrontmatterLines(content)) {
      const match = text.match(FUNCTION_IN_FRONTMATTER_PATTERN);
      if (match) {
        violations.push({
          check: 'presentation-logic',
          message: `${relativePath}:${lineNumber} — function "${match[1]}" must be moved out of page frontmatter.`,
        });
      }
    }
  }

  return violations;
}

const AI_SLOP_PHRASES: { pattern: RegExp; label: string }[] = [
  { pattern: /\bdelve\b/i, label: '"delve"' },
  { pattern: /\bunlock\b/i, label: '"unlock"' },
  { pattern: /\bseamlessly\b/i, label: '"seamlessly"' },
  { pattern: /\beffortlessly\b/i, label: '"effortlessly"' },
  { pattern: /\bleverage\b/i, label: '"leverage"' },
  { pattern: /\bempow(er|ers|ered|ering)\b/i, label: '"empower"' },
  { pattern: /\bsupercharge\b/i, label: '"supercharge"' },
  { pattern: /\bcutting.edge\b/i, label: '"cutting-edge"' },
  { pattern: /\bstreamline\b/i, label: '"streamline"' },
  { pattern: /\brevolutionize\b/i, label: '"revolutionize"' },
  { pattern: /\bgame.changer\b/i, label: '"game-changer"' },
  { pattern: /\bharness\b/i, label: '"harness"' },
  { pattern: /\btailored\b/i, label: '"tailored"' },
  { pattern: /\bsynergy\b/i, label: '"synergy"' },
  { pattern: /\bholistic\b/i, label: '"holistic"' },
  { pattern: /\bparadigm\b/i, label: '"paradigm"' },
  { pattern: /\bcurated\b/i, label: '"curated"' },
  { pattern: /\bworld.class\b/i, label: '"world-class"' },
  { pattern: /\bbest.in.class\b/i, label: '"best-in-class"' },
  { pattern: /\bnext.level\b/i, label: '"next-level"' },
  { pattern: /\bincredibly\b/i, label: '"incredibly" (filler intensifier)' },
  { pattern: /\bremarkably\b/i, label: '"remarkably" (filler intensifier)' },
  { pattern: /\bnotably\b/i, label: '"notably" (filler intensifier)' },
  {
    pattern: /\bthe uncomfortable (truth|reality|question|part|conclusion|implication)\b/i,
    label: '"the uncomfortable X" fake dramatic setup',
  },
  {
    pattern: /\bhere is the uncomfortable\b/i,
    label: '"here is the uncomfortable X" fake dramatic setup',
  },
  { pattern: /\bhere is the thing\b/i, label: '"here is the thing:" filler setup' },
  { pattern: /\bhere's the thing\b/i, label: '"here\'s the thing:" filler setup' },
  {
    pattern: /\blet me be (specific|direct|clear|concrete|honest) about\b/i,
    label: '"let me be X about" fake clarity announcer',
  },
  { pattern: /\blet me connect this\b/i, label: '"let me connect this" meta-announcement' },
  {
    pattern: /\bi want to be (specific|direct|clear|concrete|honest) about\b/i,
    label: '"I want to be X about" fake clarity announcer',
  },
  {
    pattern: /\bhere is what i want you to take from this\b/i,
    label: '"here is what I want you to take from this" condescending summarizer',
  },
  {
    pattern: /\bhere is what this means for you\b/i,
    label: '"here is what this means for you" condescending summarizer',
  },
  { pattern: /^furthermore,?\s/i, label: '"Furthermore" transition bloat' },
  { pattern: /^moreover,?\s/i, label: '"Moreover" transition bloat' },
  { pattern: /^additionally,?\s/i, label: '"Additionally" transition bloat' },
  { pattern: /\bthat said,\s/i, label: '"That said," AI connector' },
  { pattern: /\bthat being said,\s/i, label: '"That being said," AI connector' },
  { pattern: /\bwith that in mind,\s/i, label: '"With that in mind," AI connector' },
  { pattern: /\bit('s| is) worth noting that\b/i, label: '"It\'s worth noting that" hedge stack' },
  {
    pattern: /\bit('s| is) important to (mention|note|understand|recognize)\b/i,
    label: '"It\'s important to X" hedge stack',
  },
  { pattern: /\blet('s| us) dive in\b/i, label: '"let\'s dive in" rhetorical fluff' },
  { pattern: /\blet('s| us) unpack\b/i, label: '"let\'s unpack" rhetorical fluff' },
  {
    pattern: /\blet('s| us) break this down\b/i,
    label: '"let\'s break this down" rhetorical fluff',
  },
  { pattern: /\bi hope this helps\b/i, label: '"I hope this helps" fake enthusiasm' },
  { pattern: /\bhope that clarifies\b/i, label: '"hope that clarifies" fake enthusiasm' },
  { pattern: /\b—/, label: 'em dash (—)' },
];

const COPY_SCAN_EXTENSIONS = ['.astro', '.tsx'];

const COPY_EXCLUDED_DIRS = ['node_modules', 'dist', '.astro'];

function collectCopyFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (COPY_EXCLUDED_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectCopyFiles(fullPath));
    } else if (COPY_SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

function checkCopyQuality(srcDir: string): Violation[] {
  const violations: Violation[] = [];

  for (const file of collectCopyFiles(srcDir)) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    const relativePath = path.relative(process.cwd(), file);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, label } of AI_SLOP_PHRASES) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          violations.push({
            check: 'copy-quality',
            message: `${relativePath}:${i + 1} — ${label} found in user-facing copy. Replace with plain, human language.`,
          });
        }
      }
    }
  }

  return violations;
}

function main(): void {
  const libPath = path.join(process.cwd(), 'src', 'lib');
  const pagesPath = path.join(process.cwd(), 'src', 'pages');

  const contexts = discoverBoundedContexts(libPath);

  const allViolations = [
    ...checkDomainStructure(contexts),
    ...checkDomainAggregateFolders(contexts),
    ...checkInfrastructureStructure(contexts),
    ...checkPresentationLogic(pagesPath),
    ...checkCopyQuality(path.join(process.cwd(), 'src')),
  ];

  if (allViolations.length > 0) {
    const grouped = new Map<string, Violation[]>();
    for (const v of allViolations) {
      const list = grouped.get(v.check) ?? [];
      list.push(v);
      grouped.set(v.check, list);
    }

    console.error('Architecture Check FAILED\n');

    for (const [check, violations] of grouped) {
      console.error(`--- ${check} (${violations.length}) ---\n`);
      for (const v of violations) {
        console.error(`  ${v.message}\n`);
      }
    }

    console.error(`Found ${allViolations.length} violation(s) across ${grouped.size} check(s).`);
    process.exit(1);
  }

  const domainContexts = contexts.filter((c) => c.hasDomain).length;
  const infraContexts = contexts.filter((c) => c.hasInfrastructure).length;
  const astroPages = collectAstroFiles(pagesPath).length;
  const copyFiles = collectCopyFiles(path.join(process.cwd(), 'src')).length;

  console.log('Architecture Check PASSED');
  console.log(
    `Checked ${domainContexts} domain context(s), ${infraContexts} infrastructure context(s), ${astroPages} Astro page(s), ${copyFiles} copy file(s)`
  );
}

main();
