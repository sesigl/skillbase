import { describe, expect, it } from 'vitest';
import {
  toBase64Url,
  fromBase64Url,
} from '../../src/lib/catalog/infrastructure/adapters/url-encoding';

describe('Skill detail page', () => {
  describe('URL encoding round-trip', () => {
    it('encodes and decodes repository paths correctly', () => {
      const repoPath = '/Users/test/my-repo';
      const encoded = toBase64Url(repoPath);
      const decoded = fromBase64Url(encoded);

      expect(decoded).toBe(repoPath);
    });

    it('handles paths with special characters', () => {
      const repoPath = '/Users/alice/work/plugin-repo';
      const encoded = toBase64Url(repoPath);

      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
      expect(fromBase64Url(encoded)).toBe(repoPath);
    });
  });

  describe('renderMarkdown', () => {
    it('renders headings', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('# Heading 1\n\n## Heading 2\n\n### Heading 3');

      expect(html).toContain('<h1');
      expect(html).toContain('Heading 1');
      expect(html).toContain('<h2');
      expect(html).toContain('Heading 2');
      expect(html).toContain('<h3');
      expect(html).toContain('Heading 3');
    });

    it('renders fenced code blocks', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('```\nconsole.log("hello")\n```');

      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
      expect(html).toContain('console');
      expect(html).toContain('log');
    });

    it('renders inline code', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('Use the `skillbase` command');

      expect(html).toContain('<code>');
      expect(html).toContain('skillbase');
    });

    it('renders lists', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('- Item one\n- Item two\n- Item three');

      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Item one');
    });

    it('renders links', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('[Skillbase docs](https://skillbase.dev/docs)');

      expect(html).toContain('<a');
      expect(html).toContain('Skillbase docs');
    });

    it('strips raw HTML script tags for XSS protection', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('Some text\n\n<script>alert("xss")</script>');

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert');
    });

    it('blocks javascript: links in rendered output', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('[click me](javascript:alert(1))');

      expect(html).not.toContain('javascript:');
    });

    it('renders !command pattern with styling', async () => {
      const { renderMarkdown } = await import('@lib/catalog/application/renderMarkdown');
      const html = renderMarkdown('Run `!skillbase deploy` to start');

      expect(html).toContain('!skillbase');
    });
  });

  describe('SkillDetailSource', () => {
    it('wraps YAML frontmatter keys in lime-highlighted spans', async () => {
      const { highlightSource } = await import('@lib/catalog/application/renderSource');
      const rawSource = `---
name: deploy-tool
description: Deploy utility
license: MIT
---
# Deploy tool

Content here.`;

      const highlighted = highlightSource(rawSource);

      expect(highlighted).toContain('class="yaml-key"');
      expect(highlighted).toContain('>name<');
      expect(highlighted).toContain('>description<');
      expect(highlighted).toContain('>license<');
      expect(highlighted).toContain('Deploy utility');
      expect(highlighted).toContain('# Deploy tool');
    });

    it('handles content with no frontmatter', async () => {
      const { highlightSource } = await import('@lib/catalog/application/renderSource');
      const rawSource = '# Just markdown content\n\nNo frontmatter here.';

      const highlighted = highlightSource(rawSource);

      expect(highlighted).toContain('# Just markdown content');
      expect(highlighted).not.toContain('yaml-key');
    });

    it('handles empty source', async () => {
      const { highlightSource } = await import('@lib/catalog/application/renderSource');
      const highlighted = highlightSource('');

      expect(highlighted).toBe('');
    });

    it('preserves the entire source content verbatim', async () => {
      const { highlightSource } = await import('@lib/catalog/application/renderSource');
      const rawSource = `---
name: test
---
# Heading
Some text
\`\`\`
code block
\`\`\``;

      const highlighted = highlightSource(rawSource);

      expect(highlighted).toContain(': test');
      expect(highlighted).toContain('# Heading');
      expect(highlighted).toContain('code block');
      expect(highlighted).toContain('---');
    });
  });
});
