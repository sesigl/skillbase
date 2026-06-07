import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SkillDetailSource', () => {
  it('does not add template whitespace before the raw source content', () => {
    const source = readFileSync(
      new URL('../../src/components/SkillDetailSource.astro', import.meta.url),
      'utf-8'
    );

    expect(source).toContain(
      '<pre class="overflow-x-auto p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all"><Fragment set:html={highlighted} /></pre>'
    );
  });
});
