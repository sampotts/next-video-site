import type { Html, Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Matches a bare, attribute-less tag with a capitalised name, e.g. `<Video>` or `</Video>`.
 * In plain Markdown this is inert HTML, but MDX parses it as JSX and fails the build
 * if the tag is never closed ("Expected a closing tag for `<Video>`").
 */
const BARE_COMPONENT_TAG = /^<\/?[A-Z][A-Za-z0-9]*>$/;

/**
 * The README is authored as GitHub-flavoured Markdown, not MDX. Wrap any bare
 * component-looking tags that appear in prose in backticks so MDX renders them
 * as inline code instead of trying to parse them as JSX.
 *
 * Only `html` nodes are touched, so anything already inside a code fence or
 * inline code span is left exactly as it is.
 */
export function escapeBareJsxTags(markdown: string): string {
  const tree = unified().use(remarkParse).parse(markdown) as Root;

  const replacements: Array<{ start: number; end: number; value: string }> = [];
  visit(tree, 'html', (node: Html) => {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) return;
    if (!BARE_COMPONENT_TAG.test(node.value.trim())) return;
    replacements.push({ start, end, value: `\`${node.value.trim()}\`` });
  });

  // Apply from the end so earlier offsets stay valid.
  let result = markdown;
  for (const { start, end, value } of replacements.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, start) + value + result.slice(end);
  }
  return result;
}
