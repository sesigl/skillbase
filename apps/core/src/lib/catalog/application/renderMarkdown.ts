import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import hljs from 'highlight.js';

const renderer = new marked.Renderer();

renderer.codespan = ({ text }: { text: string }): string => {
  if (text.startsWith('!')) {
    return `<code class="command-pattern">${text}</code>`;
  }
  return `<code>${text}</code>`;
};

renderer.code = ({ text, lang }: { text: string; lang?: string }): string => {
  if (lang && hljs.getLanguage(lang)) {
    const highlighted = hljs.highlight(text, { language: lang }).value;
    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
  }
  const highlighted = hljs.highlightAuto(text).value;
  return `<pre><code class="hljs">${highlighted}</code></pre>`;
};

marked.use({ renderer, async: false });

export function renderMarkdown(content: string): string {
  const rawHtml = marked.parse(content) as string;
  return DOMPurify.sanitize(rawHtml);
}
