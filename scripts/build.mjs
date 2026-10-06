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
const css = [
  read('node_modules/github-markdown-css/github-markdown.css'),
  '@media (prefers-color-scheme: light) {', read('node_modules/highlight.js/styles/github.css'), '}',
  '@media (prefers-color-scheme: dark) {', read('node_modules/highlight.js/styles/github-dark.css'), '}',
  read('src/style.css'),
].join('\n');
writeFileSync('dist/style.css', css);
console.log('built');
