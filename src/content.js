import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

const pre = document.body && document.body.children.length === 1 && document.body.firstElementChild;
if (pre && pre.tagName === 'PRE' && /^text\//.test(document.contentType)) {
  render(pre.textContent);
}

function slugger() {
  const seen = new Map();
  return (text) => {
    let s = text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    const n = seen.get(s) || 0;
    seen.set(s, n + 1);
    return n ? `${s}-${n}` : s;
  };
}

async function render(source) {
  const slug = slugger();
  const marked = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        if (lang === 'mermaid') return code;
        return hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
      },
    }),
    {
      gfm: true,
      renderer: {
        code({ text, lang, escaped }) {
          if (lang === 'mermaid') {
            const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre class="mermaid">${esc}</pre>\n`;
          }
          return false;
        },
        heading({ tokens, depth, text }) {
          const inner = this.parser.parseInline(tokens);
          return `<h${depth} id="${slug(text)}">${inner}</h${depth}>\n`;
        },
        checkbox({ checked }) {
          return `<input type="checkbox" disabled${checked ? ' checked' : ''}> `;
        },
      },
    },
  );

  const html = DOMPurify.sanitize(marked.parse(source), { ADD_ATTR: ['id'] });

  const article = document.createElement('article');
  article.className = 'markdown-body';
  article.innerHTML = html;
  article.querySelectorAll('li').forEach((li) => {
    if (li.querySelector(':scope > input[type=checkbox]')) li.classList.add('task-list-item');
  });

  const h1 = article.querySelector('h1');
  const name = decodeURIComponent(location.pathname.split('/').pop() || '');
  document.title = h1 ? h1.textContent : name;
  document.body.replaceChildren(article);
  if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView();
  }

  const blocks = article.querySelectorAll('pre.mermaid');
  if (blocks.length && window.mermaid) {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    window.mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'strict' });
    for (const el of blocks) {
      const code = el.textContent;
      try {
        await window.mermaid.run({ nodes: [el] });
      } catch (e) {
        const err = document.createElement('pre');
        err.className = 'mermaid-error';
        err.textContent = `Mermaid error: ${e && e.message ? e.message : e}\n\n${code}`;
        el.replaceWith(err);
      }
    }
  }
}
