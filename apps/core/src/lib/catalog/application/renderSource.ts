const FRONTMATTER_DELIMITER = '---';

export function highlightSource(raw: string): string {
  if (!raw) return '';

  const trimmed = raw.trimStart();
  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) return raw;

  const secondDelimIndex = trimmed.indexOf(FRONTMATTER_DELIMITER, FRONTMATTER_DELIMITER.length);
  if (secondDelimIndex === -1) return raw;

  const frontmatterBlock = trimmed.slice(FRONTMATTER_DELIMITER.length, secondDelimIndex);
  const rest = trimmed.slice(secondDelimIndex + FRONTMATTER_DELIMITER.length);

  const highlightedFrontmatter = frontmatterBlock
    .split('\n')
    .map((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0 && !line.startsWith('#') && !line.startsWith('-')) {
        const key = line.slice(0, colonIndex);
        const value = line.slice(colonIndex + 1);
        return `<span class="yaml-key">${key}</span>:${value}`;
      }
      return line;
    })
    .join('\n');

  return `${FRONTMATTER_DELIMITER}\n${highlightedFrontmatter}\n${FRONTMATTER_DELIMITER}${rest}`;
}
