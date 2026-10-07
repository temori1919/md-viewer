import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

const pre = document.body && document.body.children.length === 1 && document.body.firstElementChild;
if (pre && pre.tagName === 'PRE' && /^text\//.test(document.contentType)) {
  const source = pre.textContent;
  loadTheme().then((theme) => {
    applyTheme(theme);
    render(source);
  });
}

const THEME_KEY = 'theme';

async function loadTheme() {
  try {
    const { [THEME_KEY]: saved } = await chrome.storage.local.get(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.getElementById('mdv-theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'ライトテーマに切替' : 'ダークテーマに切替';
  }
}

function createToggle() {
  const btn = document.createElement('button');
  btn.id = 'mdv-theme-toggle';
  btn.type = 'button';
  btn.addEventListener('click', async () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      await chrome.storage.local.set({ [THEME_KEY]: next });
    } catch {}
    renderMermaid();
  });
  return btn;
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
  article.querySelectorAll('pre.mermaid').forEach((el) => {
    el.dataset.mermaidSrc = el.textContent;
  });
  document.body.replaceChildren(createToggle(), article);
  applyTheme(document.documentElement.dataset.theme);
  if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView();
  }

  renderMermaid();
}

async function renderMermaid() {
  const blocks = document.querySelectorAll('[data-mermaid-src]');
  if (!blocks.length || !window.mermaid) return;
  const dark = document.documentElement.dataset.theme === 'dark';
  window.mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'strict' });
  for (const el of blocks) {
    const code = el.dataset.mermaidSrc;
    el.className = 'mermaid';
    el.removeAttribute('data-processed');
    el.textContent = code;
    try {
      await window.mermaid.run({ nodes: [el] });
    } catch (e) {
      el.className = 'mermaid-error';
      el.textContent = `Mermaid error: ${e && e.message ? e.message : e}\n\n${code}`;
    }
  }
}
