import { build } from 'esbuild';
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
await build({
  entryPoints: ['src/content.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: 'dist/content.js',
});
copyFileSync('node_modules/mermaid/dist/mermaid.min.js', 'dist/mermaid.min.js');

const read = (p) => readFileSync(p, 'utf8');
// Switch themes by html[data-theme] (set from the toggle) instead of the OS setting.
const markdownCss = read('node_modules/github-markdown-css/github-markdown.css').replace(
  /@media \(prefers-color-scheme: (light|dark)\) \{\n  \.markdown-body, \[data-theme="\1"\] \{/g,
  '@media all {\n  html[data-theme="$1"] .markdown-body {',
);
if (markdownCss.includes('prefers-color-scheme')) throw new Error('github-markdown.css format changed');
const css = [
  markdownCss,
  'html[data-theme="light"] {', read('node_modules/highlight.js/styles/github.css'), '}',
  'html[data-theme="dark"] {', read('node_modules/highlight.js/styles/github-dark.css'), '}',
  read('src/style.css'),
].join('\n');
writeFileSync('dist/style.css', css);
console.log('built');
