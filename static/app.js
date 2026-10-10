/* HomeDrive front-end - plain JavaScript, no build step. */
'use strict';

const HD = window.HD || {};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ============================================================ icons */

const ICON_PATHS = {
  folder: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  folderOpen: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
  file: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z',
  image: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  video: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
  audio: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  pdf: 'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z',
  doc: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  archive: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z',
  sheet: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 16H5v-4h6v4zm0-6H5V9h6v4zm8 6h-6v-4h6v4zm0-6h-6V9h6v4zm0-6H5V5h14v2z',
  slides: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H5V8h14v8z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  folderUpload: 'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10zM8 13.01l1.41 1.41L11 12.84V17h2v-4.16l1.59 1.59L16 13.01 12.01 9 8 13.01z',
  newFolder: 'M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  drive: 'M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z',
  cloud: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  grid: 'M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z',
  list: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  chevron: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  chevLeft: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  arrowUp: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z',
  arrowDown: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
  expandMore: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
  expandLess: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  move: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 12v-3h-4v-4h4V8l5 5-5 5z',
  copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  restore: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z',
  newTab: 'M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  sort: 'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
};
const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(name, cls = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', ('ic ' + cls).trim());
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICON_PATHS[name] || ICON_PATHS.file);
  svg.append(path);
  return svg;
}

const KIND_ICON = {
  folder: 'folder', image: 'image', video: 'video', audio: 'audio', pdf: 'pdf', text: 'doc', doc: 'doc',
  code: 'code', archive: 'archive', sheet: 'sheet', slides: 'slides', file: 'file',
};
const kindIcon = (kind, cls = '') => icon(KIND_ICON[kind] || 'file', `k-${kind} ${cls}`);

/* ============================================================ helpers */

function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled') e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) e.append(kid);
  return e;
}

function fmtSize(n) {
  if (n == null) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return (i === 0 ? n : n < 10 ? n.toFixed(1) : Math.round(n)) + ' ' + units[i];
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}
const fullDate = ts => (ts ? new Date(ts * 1000).toLocaleString() : '');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const joinPath = (a, b) => (a && b ? `${a}/${b}` : a || b);
const parentOf = p => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const baseName = p => p.slice(p.lastIndexOf('/') + 1);
const folderLabel = p => (p ? baseName(p) : 'My Drive');
const driveUrl = p => '/drive/' + p.split('/').filter(Boolean).map(encodeURIComponent).join('/');
const fileUrl = (p, download) => '/api/file?path=' + encodeURIComponent(p) + (download ? '&download=1' : '');
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const touchUI = matchMedia('(hover: none) and (pointer: coarse)').matches;

const store = {
  get(k, d) { try { const v = localStorage.getItem('homedrive.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('homedrive.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

async function api(url, opts = {}) {
  const init = { method: opts.method || 'GET', headers: { 'X-Requested-With': 'HomeDrive' } };
  if (opts.body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, init);
  if (res.status === 401) {
    location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search);
    throw new Error('Signed out');
  }
  let data = null;
  try { data = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}
const post = (url, body) => api(url, { method: 'POST', body: body || {} });

/* ============================================================ state & routing */

const S = {
  view: 'drive',          // drive | trash | search
  path: '',
  query: '',
  items: [],
  visible: [],
  byKey: new Map(),
  selected: new Set(),
  anchor: null,
  truncated: false,
  sort: store.get('sort', { key: 'name', dir: 1 }),
  layout: store.get('layout', 'list'),
  showHidden: store.get('hidden', false),
};
const keyOf = it => (S.view === 'trash' ? it.id : it.path);
const content = $('#content');

function readLocation() {
  const p = location.pathname;
  if (p === '/trash') return { view: 'trash' };
  if (p === '/search') return { view: 'search', query: new URLSearchParams(location.search).get('q') || '' };
  const rest = p.startsWith('/drive') ? p.slice('/drive'.length) : '';
  const path = rest.split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch { return s; } }).join('/');
  return { view: 'drive', path };
}

function go(url) {
  if (url !== location.pathname + location.search) history.pushState(null, '', url);
  route();
}
window.addEventListener('popstate', route);

function route() {
  const loc = readLocation();
  S.view = loc.view;
  S.path = loc.path || '';
  S.query = loc.query || '';
  S.selected.clear();
  S.anchor = null;
  closeMenus();
  closePreview();
  $('#app').classList.remove('nav-open');
  $('#searchInput').value = S.query;
  $('#searchClear').hidden = !S.query;
  for (const a of $$('.nav a')) a.classList.toggle('active', a.dataset.nav === S.view);
  document.title = (S.view === 'trash' ? 'Trash' : S.view === 'search' ? `“${S.query}”` : folderLabel(S.path)) + ' - ' + HD.title;
  refresh(true);
}

let loadSeq = 0;
async function refresh(fresh) {
  const seq = ++loadSeq;
  let spinner;
  if (fresh) {
    S.items = [];
    S.visible = [];
    renderChrome();
    spinner = setTimeout(() => content.replaceChildren(el('div', { class: 'loading' }, el('div', { class: 'spinner' }))), 150);
  }
  try {
    let data;
    if (S.view === 'drive') data = await api('/api/list?path=' + encodeURIComponent(S.path));
    else if (S.view === 'trash') data = await api('/api/trash');
    else data = await api('/api/search?q=' + encodeURIComponent(S.query));
    if (seq !== loadSeq) return;
    S.items = data.items;
    S.truncated = !!data.truncated;
    render();
  } catch (e) {
    if (seq !== loadSeq) return;
    S.items = [];
    S.visible = [];
    renderChrome();
    content.replaceChildren(el('div', { class: 'empty' }, icon('error'),
      el('h3', { text: "Couldn't open this" }), el('p', { text: e.message }),
      el('button', { class: 'btn outline', text: 'Go to My Drive', onclick: () => go('/drive/') })));
  } finally {
    clearTimeout(spinner);
  }
}

/* ============================================================ rendering */

function visibleItems() {
  let items = S.items;
  if (!S.showHidden && S.view !== 'trash') items = items.filter(i => !i.name.startsWith('.'));
  const { key, dir } = S.sort;
  return [...items].sort((a, b) => {
    if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
    let r = 0;
    if (key === 'size') r = (a.size ?? -1) - (b.size ?? -1);
    else if (key === 'mtime') r = (a.mtime || 0) - (b.mtime || 0);
    if (!r) r = collator.compare(a.name, b.name);
    return r * dir;
  });
}

function render() {
  S.visible = visibleItems();
  S.byKey = new Map(S.visible.map(i => [keyOf(i), i]));
  for (const k of [...S.selected]) if (!S.byKey.has(k)) S.selected.delete(k);
  renderChrome();
  content.replaceChildren();
  if (!S.visible.length) {
    content.append(emptyState());
    return;
  }
  if (S.layout === 'grid' && S.view !== 'trash') renderGrid();
  else renderList();
}

function renderChrome() {
  renderCrumbs();
  renderTools();
  renderInfobar();
}

function renderCrumbs() {
  const box = $('#crumbs');
  box.replaceChildren();
  if (S.view === 'trash') return box.append(el('span', { class: 'crumb static', text: 'Trash' }));
  if (S.view === 'search') return box.append(el('span', { class: 'crumb static', dir: 'auto', text: `Results for “${S.query}”` }));
  const parts = S.path ? S.path.split('/') : [];
  let crumbs = [{ name: 'My Drive', path: '' }, ...parts.map((p, i) => ({ name: p, path: parts.slice(0, i + 1).join('/') }))];
  let hidden = [];
  if (crumbs.length > 4) {  // My Drive > … > parent > current
    hidden = crumbs.slice(1, -2);
    crumbs = [crumbs[0], { more: true }, ...crumbs.slice(-2)];
  }
  crumbs.forEach((c, i) => {
    if (i) box.append(icon('chevron', 'sep'));
    if (c.more) {
      box.append(el('button', { class: 'crumb', text: '…', title: 'More folders', onclick: e =>
        showMenu(hidden.map(h => ({ label: h.name, icon: 'folder', run: () => go(driveUrl(h.path)) })), e.currentTarget) }));
    } else if (i === crumbs.length - 1) {
      box.append(el('button', { class: 'crumb current', dir: 'auto', title: c.name, dataset: { drop: c.path },
        onclick: e => showMenu(newMenuEntries(), e.currentTarget) }, el('span', { text: c.name }), icon('expandMore')));
    } else {
      box.append(el('button', { class: 'crumb', dir: 'auto', text: c.name, title: c.name, dataset: { drop: c.path },
        onclick: () => go(driveUrl(c.path)) }));
    }
  });
}

function renderTools() {
  const t = $('#tools');
  t.replaceChildren();
  if (S.view === 'trash') {
    if (S.items.length) t.append(el('button', { class: 'btn outline', text: 'Empty trash', onclick: emptyTrash }));
    return;
  }
  t.append(el('button', { class: 'icon-btn', title: S.layout === 'grid' ? 'List layout' : 'Grid layout', onclick: () => {
    S.layout = S.layout === 'grid' ? 'list' : 'grid';
    store.set('layout', S.layout);
    render();
  } }, icon(S.layout === 'grid' ? 'list' : 'grid')));
}

const SORT_LABEL = { name: 'Name', mtime: 'Modified', size: 'Size' };

function renderInfobar() {
  const bar = $('#infobar');
  bar.replaceChildren();
  const n = S.selected.size;
  if (n) {
    bar.className = 'infobar selbar';
    bar.append(
      el('button', { class: 'icon-btn', title: 'Clear selection', onclick: clearSel }, icon('close')),
      el('span', { class: 'sel-count', text: `${n} selected` }));
    for (const a of actionsFor(selectedItems())) {
      if (a.bar) bar.append(el('button', { class: 'icon-btn', title: a.label, onclick: a.run }, icon(a.icon)));
    }
    bar.append(el('button', { class: 'icon-btn', title: 'More actions', onclick: e => showMenu(actionsFor(selectedItems()), e.currentTarget) }, icon('more')));
    return;
  }
  bar.className = 'infobar';
  let text;
  if (S.view === 'trash') {
    text = HD.trashDays > 0 ? `Items in trash are deleted forever after ${HD.trashDays} days` : 'Items stay in the trash until you delete them';
  } else {
    text = plural(S.visible.length, 'item') + (S.truncated ? ' — showing the first matches, try a more specific search' : '');
  }
  bar.append(el('span', { class: 'muted', text }), el('span', { class: 'spacer' }));
  if (S.view !== 'trash' || S.items.length) {
    bar.append(el('button', { class: 'chip', title: 'Sort', onclick: e => showMenu(sortMenuEntries(), e.currentTarget) },
      icon(S.sort.dir > 0 ? 'arrowUp' : 'arrowDown'), S.view === 'trash' && S.sort.key === 'mtime' ? 'Deleted' : SORT_LABEL[S.sort.key]));
  }
}

function sortMenuEntries() {
  const keys = [['name', 'Name'], ['mtime', S.view === 'trash' ? 'Date deleted' : 'Last modified'], ['size', 'File size']];
  return [
    ...keys.map(([key, label]) => ({ label, icon: S.sort.key === key ? 'check' : null, run: () => setSort(key, key === 'name' ? 1 : -1) })),
    { sep: true },
    { label: S.sort.key === 'name' ? 'A to Z' : 'Oldest / smallest first', icon: S.sort.dir > 0 ? 'check' : null, run: () => setSort(S.sort.key, 1) },
    { label: S.sort.key === 'name' ? 'Z to A' : 'Newest / largest first', icon: S.sort.dir < 0 ? 'check' : null, run: () => setSort(S.sort.key, -1) },
  ];
}

function setSort(key, dir) {
  S.sort = { key, dir };
  store.set('sort', S.sort);
  render();
}

function emptyState() {
  if (S.view === 'trash') {
    return el('div', { class: 'empty' }, icon('trash'), el('h3', { text: 'Trash is empty' }),
      el('p', { text: 'Items you delete will show up here, so you can restore them.' }));
  }
  if (S.view === 'search') {
    return el('div', { class: 'empty' }, icon('search'), el('h3', { text: 'No results' }),
      el('p', { text: 'Nothing in your drive matches that name.' }));
  }
  return el('div', { class: 'empty' }, icon('folderUpload'), el('h3', { text: 'Drop files here' }),
    el('p', { text: 'or use the “New” button to upload files and folders.' }),
    el('button', { class: 'btn outline', onclick: () => $('#fileInput').click() }, icon('upload'), 'Upload files'));
}

const COLS = { drive: ['mtime', 'size'], search: ['location', 'mtime', 'size'], trash: ['location', 'deleted', 'size'] };
const COL_LABEL = { name: 'Name', mtime: 'Last modified', size: 'File size', location: 'Location', deleted: 'Date deleted' };

function headCell(col) {
  const key = col === 'deleted' ? 'mtime' : col;
  const sortable = col !== 'location';
  const active = sortable && S.sort.key === key;
  return el('div', {
    class: `c-${col}${sortable ? ' sortable' : ''}${active ? ' active' : ''}`,
    onclick: sortable ? () => setSort(key, active ? -S.sort.dir : key === 'name' ? 1 : -1) : null,
  }, COL_LABEL[col], active ? icon(S.sort.dir > 0 ? 'arrowUp' : 'arrowDown', 'sort-ic') : null);
}

function subline(it) {
  if (S.view === 'trash') return 'Deleted ' + fmtDate(it.deleted_at) + (it.is_dir ? '' : ' · ' + fmtSize(it.size));
  return fmtDate(it.mtime) + (it.is_dir ? '' : ' · ' + fmtSize(it.size));
}

function cell(col, it) {
  switch (col) {
    case 'mtime': return el('div', { class: 'c-mtime', text: fmtDate(it.mtime), title: fullDate(it.mtime) });
    case 'deleted': return el('div', { class: 'c-deleted', text: fmtDate(it.deleted_at), title: fullDate(it.deleted_at) });
    case 'size': return el('div', { class: 'c-size', text: it.is_dir ? '—' : fmtSize(it.size) });
    case 'location': {
      const p = parentOf(it.path);
      return el('div', { class: 'c-location' }, el('button', { class: 'loc-link', dir: 'auto', text: folderLabel(p),
        title: 'My Drive' + (p ? '/' + p : ''), onclick: e => { e.stopPropagation(); go(driveUrl(p)); } }));
    }
    default: return el('div');
  }
}

function dragProps(it) {
  if (S.view === 'trash') return {};
  const dataset = { key: keyOf(it) };
  if (it.is_dir) dataset.drop = it.path;
  return { dataset, draggable: 'true' };
}

function renderList() {
  const cols = COLS[S.view];
  const all = el('input', { type: 'checkbox', class: 'check-all', 'aria-label': 'Select all',
    onchange: e => (e.target.checked ? selectAll() : clearSel()) });
  const list = el('div', { class: 'list v-' + S.view },
    el('div', { class: 'row head' }, el('div', { class: 'c-check' }, all), headCell('name'), cols.map(headCell), el('div')));
  const frag = document.createDocumentFragment();
  for (const it of S.visible) {
    const k = keyOf(it);
    const props = dragProps(it);
    frag.append(el('div', { class: 'row item', ...props, dataset: { ...props.dataset, key: k } },
      el('div', { class: 'c-check' }, el('input', { type: 'checkbox', class: 'sel-check', 'aria-label': 'Select ' + it.name })),
      el('div', { class: 'c-name' }, kindIcon(it.kind),
        el('div', { class: 'txt' },
          el('span', { class: 'name', dir: 'auto', text: it.name, title: it.name }),
          el('span', { class: 'sub', text: subline(it) }))),
      cols.map(c => cell(c, it)),
      el('div', { class: 'c-more' }, el('button', { class: 'icon-btn more-btn', title: 'More actions' }, icon('more')))));
  }
  list.append(frag);
  content.append(list);
  updateSel();
}

function renderGrid() {
  const folders = S.visible.filter(i => i.is_dir);
  const files = S.visible.filter(i => !i.is_dir);
  const moreBtn = () => el('button', { class: 'icon-btn more-btn', title: 'More actions' }, icon('more'));
  const tip = it => (S.view === 'search' ? 'My Drive/' + it.path : it.name);  // search results come from many folders
  if (folders.length) {
    content.append(el('div', { class: 'section-title', text: 'Folders' }),
      el('div', { class: 'grid folders' }, folders.map(it =>
        el('div', { class: 'item tile', title: tip(it), ...dragProps(it) },
          kindIcon('folder'), el('span', { class: 'name', dir: 'auto', text: it.name }), moreBtn()))));
  }
  if (files.length) {
    content.append(el('div', { class: 'section-title', text: 'Files' }),
      el('div', { class: 'grid files' }, files.map(it =>
        el('div', { class: 'item card', title: tip(it), ...dragProps(it) },
          el('div', { class: 'card-head' }, kindIcon(it.kind), el('span', { class: 'name', dir: 'auto', text: it.name }), moreBtn()),
          el('div', { class: 'thumb' }, thumbFor(it))))));
  }
  updateSel();
}

const NATIVE_IMG = /\.(jpe?g|jfif|png|gif|webp|bmp|svg|avif|ico|apng)$/i;
const PIL_IMG = /\.(jpe?g|jfif|png|gif|webp|bmp|tiff?)$/i;

function thumbSrc(it, large) {
  if (it.kind !== 'image') return null;
  if (HD.thumbs && PIL_IMG.test(it.name)) {
    return `/api/thumb?path=${encodeURIComponent(it.path)}&v=${Math.floor(it.mtime)}${large ? '&size=lg' : ''}`;
  }
  if (/\.svg$/i.test(it.name) || (NATIVE_IMG.test(it.name) && it.size < 3e6)) return fileUrl(it.path);
  return null;
}

function thumbFor(it) {
  const src = thumbSrc(it);
  if (!src) return kindIcon(it.kind, 'big');
  const img = el('img', { src, alt: '', loading: 'lazy', draggable: 'false' });
  img.addEventListener('error', () => img.replaceWith(kindIcon(it.kind, 'big')), { once: true });
  return img;
}

/* ============================================================ selection */

const selectedItems = () => S.visible.filter(i => S.selected.has(keyOf(i)));

function updateSel() {
  for (const row of $$('.item', content)) {
    const on = S.selected.has(row.dataset.key);
    row.classList.toggle('sel', on);
    const c = row.querySelector('.sel-check');
    if (c) c.checked = on;
  }
  const all = $('.check-all', content);
  if (all) {
    all.checked = S.selected.size > 0 && S.selected.size === S.visible.length;
    all.indeterminate = S.selected.size > 0 && !all.checked;
  }
  renderInfobar();
}
function selectOnly(k) { S.selected = new Set([k]); S.anchor = k; updateSel(); }
function toggleSel(k) { if (S.selected.has(k)) S.selected.delete(k); else S.selected.add(k); S.anchor = k; updateSel(); }
function selectAll() { for (const i of S.visible) S.selected.add(keyOf(i)); updateSel(); }
function clearSel() { if (S.selected.size) { S.selected.clear(); updateSel(); } }
function rangeSel(from, to, add) {
  const keys = S.visible.map(keyOf);
  let i = keys.indexOf(from), j = keys.indexOf(to);
  if (i < 0) i = j;
  if (i > j) [i, j] = [j, i];
  if (!add) S.selected.clear();
  for (let x = i; x <= j; x++) S.selected.add(keys[x]);
  updateSel();
}

content.addEventListener('click', e => {
  const row = e.target.closest('.item');
  if (!row) {
    if (!e.target.closest('button, input, a')) clearSel();
    return;
  }
  const k = row.dataset.key;
  const it = S.byKey.get(k);
  if (e.target.closest('.more-btn')) {
    if (!S.selected.has(k)) selectOnly(k);
    showMenu(actionsFor(selectedItems()), e.target.closest('.more-btn'));
    return;
  }
  if (e.target.closest('.sel-check')) {
    if (e.shiftKey && S.anchor != null) rangeSel(S.anchor, k, true);
    else toggleSel(k);
    return;
  }
  if (e.target.closest('.loc-link')) return;
  if (touchUI) {
    if (S.selected.size || S.view === 'trash') toggleSel(k);
    else openItem(it);
    return;
  }
  if (e.shiftKey && S.anchor != null) rangeSel(S.anchor, k, e.ctrlKey || e.metaKey);
  else if (e.ctrlKey || e.metaKey) toggleSel(k);
  else selectOnly(k);
});

content.addEventListener('dblclick', e => {
  const row = e.target.closest('.item');
  if (row && !e.target.closest('.more-btn, .sel-check, .loc-link')) openItem(S.byKey.get(row.dataset.key));
});

content.addEventListener('contextmenu', e => {
  const row = e.target.closest('.item');
  e.preventDefault();
  const at = { x: e.clientX, y: e.clientY };
  if (!row) {
    clearSel();
    if (S.view === 'drive') showMenu(newMenuEntries(), at);
    return;
  }
  if (!S.selected.has(row.dataset.key)) selectOnly(row.dataset.key);
  showMenu(actionsFor(selectedItems()), at);
});

function openItem(it) {
  if (!it || S.view === 'trash') return;
  if (it.is_dir) go(driveUrl(it.path));
  else openPreview(it);
}

/* ============================================================ menus */

let openMenuEl = null;

function closeMenus() {
  if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; }
}

// entries: [{label, icon, run, danger}] | {sep: true} | {header: 'text'}; at: element or {x, y}
function showMenu(entries, at) {
  closeMenus();
  const m = el('div', { class: 'menu', role: 'menu' });
  for (const a of entries) {
    if (a.sep) {
      if (m.lastChild && m.lastChild.tagName !== 'HR') m.append(el('hr'));
    } else if (a.header) {
      m.append(el('div', { class: 'menu-head', dir: 'auto', text: a.header }));
    } else {
      m.append(el('button', { role: 'menuitem', class: a.danger ? 'danger' : null, onclick: () => { closeMenus(); a.run(); } },
        a.icon ? icon(a.icon) : el('span', { class: 'blank' }), el('span', { text: a.label })));
    }
  }
  if (m.lastChild && m.lastChild.tagName === 'HR') m.lastChild.remove();
  document.body.append(m);
  openMenuEl = m;
  const r = at instanceof Element ? at.getBoundingClientRect() : { left: at.x, right: at.x, top: at.y, bottom: at.y };
  const w = m.offsetWidth, h = m.offsetHeight;
  let x = r.left, y = r.bottom + (at instanceof Element ? 4 : 0);
  if (x + w > innerWidth - 8) x = Math.max(8, r.right - w);
  if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - (at instanceof Element ? 4 : 0));
  m.style.left = x + 'px';
  m.style.top = y + 'px';
}

document.addEventListener('mousedown', e => { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenus(); }, true);
document.addEventListener('touchstart', e => { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenus(); }, { capture: true, passive: true });
window.addEventListener('resize', closeMenus);
content.addEventListener('scroll', closeMenus, { passive: true });

function newMenuEntries() {
  return [
    { label: 'New folder', icon: 'newFolder', run: newFolder },
    { sep: true },
    { label: 'File upload', icon: 'upload', run: () => $('#fileInput').click() },
    { label: 'Folder upload', icon: 'folderUpload', run: () => $('#folderInput').click() },
  ];
}

function actionsFor(items) {
  if (!items.length) return [];
  const one = items.length === 1 ? items[0] : null;
  if (S.view === 'trash') {
    return [
      { label: 'Restore', icon: 'restore', bar: true, run: () => restoreItems(items) },
      { label: 'Delete forever', icon: 'trash', bar: true, danger: true, run: () => deleteForever(items) },
    ];
  }
  const acts = [];
  if (one) acts.push({ label: one.is_dir ? 'Open' : 'Preview', icon: one.is_dir ? 'folderOpen' : 'eye', run: () => openItem(one) });
  acts.push({ label: 'Download', icon: 'download', bar: true, run: () => downloadItems(items) });
  if (one) acts.push({ label: 'Rename', icon: 'edit', bar: true, run: () => renameItem(one) });
  acts.push({ sep: true });
  acts.push({ label: 'Move to…', icon: 'move', bar: true, run: () => transferItems(items, false) });
  acts.push({ label: 'Make a copy in…', icon: 'copy', run: () => transferItems(items, true) });
  if (one && S.view === 'search') acts.push({ label: 'Show file location', icon: 'folder', run: () => go(driveUrl(parentOf(one.path))) });
  if (one && !one.is_dir) acts.push({ label: 'Open in new tab', icon: 'newTab', run: () => window.open(fileUrl(one.path), '_blank', 'noopener') });
  acts.push({ sep: true });
  acts.push({ label: 'Move to trash', icon: 'trash', bar: true, run: () => trashItems(items) });
  return acts;
}

/* ============================================================ dialogs */

const modals = [];

function openModal(card, onClose) {
  const back = el('div', { class: 'modal-back' }, card);
  const entry = { close };
  back.addEventListener('mousedown', e => { if (e.target === back) close(); });
  document.body.append(back);
  modals.push(entry);
  function close() {
    if (!back.isConnected) return;
    back.remove();
    modals.splice(modals.indexOf(entry), 1);
    if (onClose) onClose();
  }
  return close;
}

function promptDialog({ title, value = '', ok = 'OK', selectTo }) {
  return new Promise(resolve => {
    let result = null;
    const input = el('input', { type: 'text', value, dir: 'auto', spellcheck: 'false', autocomplete: 'off' });
    const card = el('form', { class: 'modal', onsubmit: e => {
      e.preventDefault();
      const v = input.value.trim();
      if (v) { result = v; close(); }
    } },
    el('h2', { text: title }), input,
    el('div', { class: 'actions' },
      el('button', { type: 'button', class: 'btn', text: 'Cancel', onclick: () => close() }),
      el('button', { type: 'submit', class: 'btn', text: ok })));
    const close = openModal(card, () => resolve(result));
    input.focus();
    input.setSelectionRange(0, selectTo == null ? value.length : selectTo);
  });
}

function confirmDialog({ title, text, ok = 'OK', danger }) {
  return new Promise(resolve => {
    let result = false;
    const okBtn = el('button', { type: 'button', class: 'btn' + (danger ? ' primary danger' : ' primary'), text: ok,
      onclick: () => { result = true; close(); } });
    const card = el('div', { class: 'modal' }, el('h2', { text: title }), el('p', { dir: 'auto', text }),
      el('div', { class: 'actions' }, el('button', { type: 'button', class: 'btn', text: 'Cancel', onclick: () => close() }), okBtn));
    const close = openModal(card, () => resolve(result));
    okBtn.focus();
  });
}

function pickFolder({ title, ok, start = '', exclude = [] }) {
  return new Promise(resolve => {
    let cur = start, result = null, seq = 0;
    const blocked = p => exclude.some(x => p === x || p.startsWith(x + '/'));
    const head = el('div', { class: 'picker-head' });
    const list = el('div', { class: 'picker-list' });
    const okBtn = el('button', { type: 'button', class: 'btn primary', text: ok, onclick: () => { result = cur; close(); } });
    const card = el('div', { class: 'modal wide' }, el('h2', { text: title }), head, list,
      el('div', { class: 'actions' },
        el('button', { type: 'button', class: 'btn', title: 'New folder', onclick: makeFolder }, icon('newFolder')),
        el('span', { class: 'spacer' }),
        el('button', { type: 'button', class: 'btn', text: 'Cancel', onclick: () => close() }), okBtn));
    const close = openModal(card, () => resolve(result));

    async function load(p) {
      const my = ++seq;
      cur = p;
      okBtn.disabled = blocked(p);
      head.replaceChildren(
        el('button', { type: 'button', class: 'icon-btn', title: 'Up one level', disabled: !p, onclick: () => load(parentOf(p)) }, icon('back')),
        el('span', { class: 'picker-title', dir: 'auto', text: folderLabel(p) }));
      list.replaceChildren(el('div', { class: 'picker-msg', text: 'Loading…' }));
      try {
        const data = await api('/api/list?path=' + encodeURIComponent(p));
        if (my !== seq) return;
        const dirs = data.items.filter(i => i.is_dir && (S.showHidden || !i.name.startsWith('.')))
          .sort((a, b) => collator.compare(a.name, b.name));
        list.replaceChildren(...(dirs.length ? dirs.map(d =>
          el('button', { type: 'button', class: 'picker-item', disabled: blocked(d.path), onclick: () => load(d.path) },
            kindIcon('folder'), el('span', { dir: 'auto', text: d.name }), icon('chevron', 'chev')))
          : [el('div', { class: 'picker-msg', text: 'No folders in here' })]));
      } catch (e) {
        if (my === seq) list.replaceChildren(el('div', { class: 'picker-msg', text: e.message }));
      }
    }
    async function makeFolder() {
      const name = await promptDialog({ title: 'New folder', value: 'Untitled folder', ok: 'Create' });
      if (!name) return;
      try {
        await post('/api/mkdir', { path: cur, name });
        load(joinPath(cur, name));
      } catch (e) { toastError(e); }
    }
    load(start);
  });
}

/* ============================================================ toasts */

function toast(msg, action, isError) {
  const t = el('div', { class: 'toast' + (isError ? ' error' : ''), role: isError ? 'alert' : 'status' },
    el('span', { class: 'toast-msg', dir: 'auto', text: msg }));
  if (action) t.append(el('button', { text: action.label, onclick: () => { t.remove(); action.run(); } }));
  t.append(el('button', { class: 'toast-x', 'aria-label': 'Dismiss', onclick: () => t.remove() }, icon('close')));
  const box = $('#toasts');
  box.append(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => t.remove(), action || isError ? 8000 : 4000);
}
const toastError = e => toast(e.message || String(e), null, true);
const quoteName = items => (items.length === 1 ? `“${items[0].name}”` : plural(items.length, 'item'));

/* ============================================================ actions */

async function newFolder() {
  const base = S.view === 'drive' ? S.path : '';
  const name = await promptDialog({ title: 'New folder', value: 'Untitled folder', ok: 'Create' });
  if (!name) return;
  try {
    await post('/api/mkdir', { path: base, name });
    if (S.view === 'drive') await refresh();
    toast(`Created “${name}”` + (S.view === 'drive' ? '' : ' in My Drive'));
  } catch (e) { toastError(e); }
}

async function renameItem(it) {
  const dot = it.is_dir ? -1 : it.name.lastIndexOf('.');
  const name = await promptDialog({ title: 'Rename', value: it.name, ok: 'OK', selectTo: dot > 0 ? dot : it.name.length });
  if (!name || name === it.name) return;
  try {
    const entry = await post('/api/rename', { path: it.path, name });
    await refresh();
    selectOnly(entry.path);
  } catch (e) { toastError(e); }
}

async function trashItems(items) {
  try {
    const r = await post('/api/delete', { paths: items.map(i => i.path) });
    S.selected.clear();
    await refresh();
    toast(`${quoteName(items)} moved to trash`, { label: 'Undo', run: async () => {
      try { await post('/api/trash/restore', { ids: r.ids }); await refresh(); toast('Restored'); } catch (e) { toastError(e); }
    } });
  } catch (e) { toastError(e); refresh(); }
}

async function restoreItems(items) {
  try {
    await post('/api/trash/restore', { ids: items.map(i => i.id) });
    S.selected.clear();
    await refresh();
    toast(`${quoteName(items)} restored`);
  } catch (e) { toastError(e); refresh(); }
}

async function deleteForever(items) {
  const ok = await confirmDialog({
    title: 'Delete forever?',
    text: `${quoteName(items)} will be deleted forever. This can't be undone.`,
    ok: 'Delete forever', danger: true,
  });
  if (!ok) return;
  try {
    await post('/api/trash/delete', { ids: items.map(i => i.id) });
    S.selected.clear();
    await refresh();
    refreshStorage();
  } catch (e) { toastError(e); refresh(); }
}

async function emptyTrash() {
  const ok = await confirmDialog({
    title: 'Empty trash?',
    text: 'All items in the trash will be deleted forever. This can\'t be undone.',
    ok: 'Empty trash', danger: true,
  });
  if (!ok) return;
  try {
    await post('/api/trash/empty');
    await refresh();
    refreshStorage();
  } catch (e) { toastError(e); }
}

function downloadItems(items) {
  if (items.length === 1 && !items[0].is_dir) {
    const a = el('a', { href: fileUrl(items[0].path, true), download: '' });
    document.body.append(a);
    a.click();
    a.remove();
    return;
  }
  // Folders / several items: the server streams a zip. A hidden iframe keeps errors off the page.
  const form = el('form', { method: 'POST', action: '/api/zip', target: 'dlframe' },
    el('input', { type: 'hidden', name: 'paths', value: JSON.stringify(items.map(i => i.path)) }));
  document.body.append(form);
  form.submit();
  form.remove();
  toast(`Zipping ${quoteName(items)} — the download will start in a moment`);
}

$('#dlframe').addEventListener('load', e => {
  try {
    const text = e.target.contentDocument.body.textContent.trim();
    if (text) toastError(new Error(JSON.parse(text).error || 'Download failed'));
  } catch { /* a real download, or blank */ }
});

async function transferItems(items, copy) {
  const start = S.view === 'drive' ? S.path : parentOf(items[0].path);
  const dest = await pickFolder({
    title: (copy ? 'Copy ' : 'Move ') + quoteName(items),
    ok: copy ? 'Copy here' : 'Move here',
    start,
    exclude: items.filter(i => i.is_dir).map(i => i.path),
  });
  if (dest == null) return;
  if (copy) toast(`Copying ${quoteName(items)}…`);
  try {
    await post(copy ? '/api/copy' : '/api/move', { paths: items.map(i => i.path), dest });
    S.selected.clear();
    await refresh();
    toast(`${copy ? 'Copied' : 'Moved'} ${quoteName(items)} to “${folderLabel(dest)}”`);
    if (copy) refreshStorage();
  } catch (e) { toastError(e); }
}

async function moveTo(paths, dest) {
  paths = paths.filter(p => p !== dest && parentOf(p) !== dest);
  if (!paths.length) return;
  try {
    await post('/api/move', { paths, dest });
    S.selected.clear();
    await refresh();
    const what = paths.length === 1 ? `“${baseName(paths[0])}”` : plural(paths.length, 'item');
    toast(`Moved ${what} to “${folderLabel(dest)}”`);
  } catch (e) { toastError(e); }
}

async function refreshStorage() {
  try {
    const s = await api('/api/storage');
    const pct = s.total ? (s.used / s.total) * 100 : 0;
    $('#storage .bar > i').style.width = pct.toFixed(1) + '%';
    $('#storage .bar').classList.toggle('full', pct > 90);
    $('#storageText').textContent = `${fmtSize(s.used)} of ${fmtSize(s.total)} used`;
  } catch { /* not critical */ }
}

/* ============================================================ preview */

const P = { list: [], idx: 0, el: null };

function openPreview(it) {
  P.list = S.visible.filter(i => !i.is_dir);
  P.idx = Math.max(0, P.list.findIndex(i => i.path === it.path));
  if (!P.el) {
    P.el = el('div', { class: 'preview', role: 'dialog', 'aria-modal': 'true' });
    document.body.append(P.el);
  }
  renderPreview();
}

function closePreview() {
  if (P.el) { P.el.remove(); P.el = null; }
}

function stepPreview(d) {
  if (P.list.length < 2) return;
  P.idx = (P.idx + d + P.list.length) % P.list.length;
  renderPreview();
}

function renderPreview() {
  const it = P.list[P.idx];
  const many = P.list.length > 1;
  const body = el('div', { class: 'pv-body', onclick: e => { if (e.target === body) closePreview(); } });
  P.el.replaceChildren(
    el('div', { class: 'pv-head' },
      el('button', { class: 'icon-btn', title: 'Close (Esc)', onclick: closePreview }, icon('back')),
      kindIcon(it.kind),
      el('div', { class: 'pv-title', dir: 'auto', text: it.name, title: it.name }),
      many ? el('span', { class: 'pv-count', text: `${P.idx + 1} / ${P.list.length}` }) : null,
      el('a', { class: 'icon-btn', href: fileUrl(it.path), target: '_blank', rel: 'noopener', title: 'Open in new tab' }, icon('newTab')),
      el('a', { class: 'icon-btn', href: fileUrl(it.path, true), download: '', title: 'Download' }, icon('download'))),
    body);
  body.append(previewContent(it));
  if (many) {
    body.append(
      el('button', { class: 'icon-btn pv-nav pv-prev', title: 'Previous (←)', onclick: () => stepPreview(-1) }, icon('chevLeft')),
      el('button', { class: 'icon-btn pv-nav pv-next', title: 'Next (→)', onclick: () => stepPreview(1) }, icon('chevron')));
  }
  let sx = null;  // swipe left/right on phones
  body.addEventListener('touchstart', e => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  body.addEventListener('touchend', e => {
    if (sx == null || it.kind === 'video' || it.kind === 'audio') return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 60) stepPreview(dx < 0 ? 1 : -1);
    sx = null;
  });
}

function previewContent(it) {
  const url = fileUrl(it.path);
  const fallback = msg => el('div', { class: 'pv-none' }, kindIcon(it.kind, 'huge'),
    el('p', { text: msg || 'No preview available' }),
    el('p', { class: 'muted', text: `${fmtSize(it.size)} · modified ${fullDate(it.mtime)}` }),
    el('a', { class: 'btn primary', href: fileUrl(it.path, true), download: '' }, icon('download'), 'Download'));
  switch (it.kind) {
    case 'image': {
      const src = NATIVE_IMG.test(it.name) ? url : thumbSrc(it, true);
      if (!src) return fallback("This image type can't be shown in the browser");
      const img = el('img', { src, alt: it.name, class: 'pv-media' });
      img.addEventListener('error', () => img.replaceWith(fallback("This image can't be shown in the browser")), { once: true });
      return img;
    }
    case 'video': {
      const v = el('video', { src: url, controls: true, autoplay: true, playsinline: true, class: 'pv-media' });
      v.addEventListener('error', () => v.replaceWith(fallback("This video format can't be played in the browser")), { once: true });
      return v;
    }
    case 'audio':
      return el('div', { class: 'pv-audio' }, kindIcon('audio', 'huge'), el('audio', { src: url, controls: true, autoplay: true }));
    case 'pdf':
      return el('iframe', { src: url, class: 'pv-frame', title: it.name });
    case 'text':
    case 'code': {
      if (it.size > 2 * 1024 * 1024) return fallback('This file is too big to preview');
      const pre = el('pre', { class: 'pv-text', dir: 'auto', text: 'Loading…' });
      fetch(url)
        .then(r => { if (!r.ok) throw new Error(r.statusText); return r.text(); })
        .then(t => { pre.textContent = t; })
        .catch(e => { pre.textContent = "Couldn't load the file: " + e.message; });
      return pre;
    }
    default:
      return fallback();
  }
}

/* ============================================================ uploads */

const U = { jobs: [], queue: [], active: 0, max: 3, minimized: false, raf: 0, refreshTimer: 0 };

function addUploads(entries, dir) {
  if (!entries.length) return;
  for (const { file, rel } of entries) {
    const job = { file, rel: rel || file.name, dir, loaded: 0, status: 'queued', error: '', xhr: null };
    U.jobs.push(job);
    U.queue.push(job);
  }
  U.minimized = false;
  pumpUploads();
  drawUploads();
}

function pumpUploads() {
  while (U.active < U.max && U.queue.length) startUpload(U.queue.shift());
}

function startUpload(job) {
  U.active++;
  job.status = 'uploading';
  job.loaded = 0;
  const xhr = new XMLHttpRequest();
  job.xhr = xhr;
  xhr.open('PUT', '/api/upload');
  xhr.setRequestHeader('X-Requested-With', 'HomeDrive');
  xhr.setRequestHeader('X-Upload-Dir', encodeURIComponent(job.dir));
  xhr.setRequestHeader('X-Upload-Name', encodeURIComponent(job.rel));
  if (job.file.lastModified) xhr.setRequestHeader('X-Upload-Mtime', String(job.file.lastModified));
  xhr.setRequestHeader('Content-Type', 'application/octet-stream');
  xhr.upload.onprogress = e => { job.loaded = e.loaded; drawUploadsSoon(); };
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      job.status = 'done';
      job.loaded = job.file.size;
      return;
    }
    job.status = 'error';
    job.error = xhr.status === 401 ? 'Signed out — reload the page and sign in' : `Upload failed (${xhr.status})`;
    try { job.error = JSON.parse(xhr.responseText).error || job.error; } catch { /* keep default */ }
  };
  xhr.onerror = () => { job.status = 'error'; job.error = 'Network error — check your connection'; };
  xhr.onabort = () => { job.status = 'canceled'; };
  xhr.onloadend = () => {
    job.xhr = null;
    U.active--;
    pumpUploads();
    drawUploads();
    if (job.status === 'done') uploadLanded();
  };
  xhr.send(job.file);
}

function uploadLanded() {
  if (U.refreshTimer) return;  // throttle: at most one refresh per second while uploads finish
  U.refreshTimer = setTimeout(() => {
    U.refreshTimer = 0;
    if (S.view === 'drive') refresh();
    refreshStorage();
  }, 1000);
}

function cancelJob(job) {
  if (job.xhr) job.xhr.abort();
  else if (job.status === 'queued') {
    U.queue.splice(U.queue.indexOf(job), 1);
    job.status = 'canceled';
  }
  drawUploads();
}

function retryJob(job) {
  job.status = 'queued';
  job.error = '';
  U.queue.push(job);
  pumpUploads();
  drawUploads();
}

async function closeUploads() {
  const pending = U.jobs.filter(j => j.status === 'uploading' || j.status === 'queued');
  if (pending.length) {
    const ok = await confirmDialog({ title: 'Cancel uploads?', text: `${plural(pending.length, 'upload')} haven't finished yet.`, ok: 'Cancel uploads', danger: true });
    if (!ok) return;
    U.queue.length = 0;
    for (const j of pending) cancelJob(j);
  }
  U.jobs = [];
  drawUploads();
}

function drawUploadsSoon() {
  if (!U.raf) U.raf = requestAnimationFrame(() => { U.raf = 0; drawUploads(); });
}

const UP_ORDER = { uploading: 0, queued: 1, error: 2, done: 3, canceled: 4 };

function drawUploads() {
  const box = $('#uploads');
  if (!U.jobs.length) { box.hidden = true; return; }
  box.hidden = false;
  box.classList.toggle('min', U.minimized);
  const pending = U.jobs.filter(j => j.status === 'uploading' || j.status === 'queued');
  const done = U.jobs.filter(j => j.status === 'done').length;
  const failed = U.jobs.filter(j => j.status === 'error').length;
  let title = pending.length ? `Uploading ${plural(pending.length, 'item')}` : `${plural(done, 'upload')} complete`;
  if (failed) title += `, ${failed} failed`;
  const live = U.jobs.filter(j => j.status !== 'canceled');
  const total = live.reduce((s, j) => s + j.file.size, 0);
  const loaded = live.reduce((s, j) => s + (j.status === 'done' ? j.file.size : j.loaded), 0);
  const shown = [...U.jobs].sort((a, b) => UP_ORDER[a.status] - UP_ORDER[b.status]).slice(0, 200);
  box.replaceChildren(
    el('div', { class: 'up-head' },
      el('span', { class: 'up-title', text: title }),
      el('button', { class: 'icon-btn', title: U.minimized ? 'Expand' : 'Minimize', onclick: () => { U.minimized = !U.minimized; drawUploads(); } },
        icon(U.minimized ? 'expandLess' : 'expandMore')),
      el('button', { class: 'icon-btn', title: pending.length ? 'Cancel all' : 'Close', onclick: closeUploads }, icon('close'))),
    pending.length ? el('div', { class: 'up-total' }, el('i', { style: `width:${total ? ((loaded / total) * 100).toFixed(1) : 0}%` })) : null,
    el('div', { class: 'up-list' }, shown.map(uploadRow),
      U.jobs.length > shown.length ? el('div', { class: 'up-more', text: `+ ${U.jobs.length - shown.length} more` }) : null));
}

function uploadRow(j) {
  const pct = j.file.size ? Math.min(100, (j.loaded / j.file.size) * 100) : 0;
  let right;
  if (j.status === 'done') right = icon('check', 'ok');
  else if (j.status === 'error') right = el('button', { class: 'icon-btn', title: 'Retry', onclick: () => retryJob(j) }, icon('restore'));
  else if (j.status === 'canceled') right = el('span', { class: 'muted small', text: 'Canceled' });
  else right = el('button', { class: 'icon-btn', title: 'Cancel', onclick: () => cancelJob(j) }, icon('close'));
  const sub = {
    error: j.error,
    queued: 'Waiting…',
    uploading: `${fmtSize(j.loaded)} of ${fmtSize(j.file.size)}`,
    done: `${fmtSize(j.file.size)} · in ${folderLabel(j.dir)}`,
    canceled: '',
  }[j.status];
  return el('div', { class: 'up-item ' + j.status }, icon('file', 'k-file'),
    el('div', { class: 'up-meta' },
      el('div', { class: 'up-name', dir: 'auto', text: j.rel, title: 'My Drive/' + joinPath(j.dir, j.rel) }),
      el('div', { class: 'up-sub', text: sub }),
      j.status === 'uploading' ? el('div', { class: 'prog' }, el('i', { style: `width:${pct.toFixed(1)}%` })) : null),
    right);
}

window.addEventListener('beforeunload', e => {
  if (U.active || U.queue.length) { e.preventDefault(); e.returnValue = ''; }
});

const uploadDir = () => (S.view === 'drive' ? S.path : '');
$('#fileInput').addEventListener('change', e => {
  addUploads([...e.target.files].map(f => ({ file: f, rel: f.name })), uploadDir());
  e.target.value = '';
});
$('#folderInput').addEventListener('change', e => {
  addUploads([...e.target.files].map(f => ({ file: f, rel: f.webkitRelativePath || f.name })), uploadDir());
  e.target.value = '';
});

/* ============================================================ drag & drop */

let internalDrag = null;  // paths being dragged inside the page
let dropHi = null;
let dragHideTimer = 0;
const panel = $('#panel');

function setDropHi(t) {
  if (dropHi === t) return;
  if (dropHi) dropHi.classList.remove('drop');
  dropHi = t;
  if (t) t.classList.add('drop');
}
const dropTargetOf = e => (e.target.closest ? e.target.closest('[data-drop]') : null);
const isFileDrag = e => !internalDrag && e.dataTransfer && [...e.dataTransfer.types].includes('Files');

function endFileDrag() {
  panel.classList.remove('dragging');
  setDropHi(null);
}

// Must be called synchronously from the drop handler: DataTransfer items vanish after it returns.
async function collectDropped(dt) {
  const entries = [...dt.items].filter(i => i.kind === 'file').map(i => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null));
  const files = [...dt.files];
  if (!entries.length || entries.some(x => !x)) return files.map(f => ({ file: f, rel: f.name }));
  const out = [];
  async function walk(entry, prefix) {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      out.push({ file, rel: prefix + file.name });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      for (;;) {
        const batch = await new Promise((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        for (const child of batch) await walk(child, prefix + entry.name + '/');
      }
    }
  }
  for (const entry of entries) await walk(entry, '');
  return out;
}

document.addEventListener('dragstart', e => {
  const row = e.target.closest && e.target.closest('.item[draggable="true"]');
  if (!row) return;
  const k = row.dataset.key;
  if (!S.selected.has(k)) selectOnly(k);
  internalDrag = [...S.selected];
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', internalDrag.map(baseName).join('\n'));
  const ghost = el('div', { class: 'drag-ghost', text: internalDrag.length === 1 ? baseName(internalDrag[0]) : plural(internalDrag.length, 'item') });
  document.body.append(ghost);
  e.dataTransfer.setDragImage(ghost, 16, 16);
  setTimeout(() => ghost.remove());
});

document.addEventListener('dragend', () => { internalDrag = null; setDropHi(null); });

document.addEventListener('dragover', e => {
  if (internalDrag) {
    const t = dropTargetOf(e);
    if (t && !internalDrag.includes(t.dataset.drop)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropHi(t);
    } else {
      setDropHi(null);
    }
    return;
  }
  if (!isFileDrag(e)) return;
  e.preventDefault();  // never let the browser navigate to a dropped file
  if (S.view !== 'drive') { e.dataTransfer.dropEffect = 'none'; return; }
  e.dataTransfer.dropEffect = 'copy';
  const t = dropTargetOf(e);
  setDropHi(t);
  panel.classList.add('dragging');
  $('#dropText').textContent = `Drop to upload to “${folderLabel(t ? t.dataset.drop : S.path)}”`;
  clearTimeout(dragHideTimer);
  dragHideTimer = setTimeout(endFileDrag, 300);
});

document.addEventListener('drop', e => {
  const t = dropTargetOf(e);
  if (internalDrag) {
    e.preventDefault();
    const paths = internalDrag;
    internalDrag = null;
    setDropHi(null);
    if (t) moveTo(paths, t.dataset.drop);
    return;
  }
  if (!isFileDrag(e)) return;
  e.preventDefault();
  endFileDrag();
  if (S.view !== 'drive') return;
  const dest = t ? t.dataset.drop : S.path;
  collectDropped(e.dataTransfer).then(list => addUploads(list, dest)).catch(toastError);
});

/* ============================================================ keyboard */

document.addEventListener('keydown', e => {
  if (modals.length) {
    if (e.key === 'Escape') { e.preventDefault(); modals[modals.length - 1].close(); }
    return;
  }
  if (P.el) {
    if (e.key === 'Escape') closePreview();
    else if (e.key === 'ArrowLeft') stepPreview(-1);
    else if (e.key === 'ArrowRight') stepPreview(1);
    return;
  }
  if (e.key === 'Escape') {
    if (openMenuEl) closeMenus();
    else clearSel();
    return;
  }
  if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (openMenuEl) return;
  const items = selectedItems();
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    selectAll();
  } else if (e.key === 'Delete' && items.length) {
    if (S.view === 'trash') deleteForever(items);
    else trashItems(items);
  } else if (e.key === 'F2' && items.length === 1 && S.view !== 'trash') {
    e.preventDefault();
    renameItem(items[0]);
  } else if (e.key === 'Enter' && items.length === 1) {
    openItem(items[0]);
  } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && S.visible.length) {
    e.preventDefault();
    const keys = S.visible.map(keyOf);
    let i = keys.indexOf(S.anchor);
    i = i < 0 ? 0 : Math.min(keys.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)));
    selectOnly(keys[i]);
    const row = $$('.item', content).find(r => r.dataset.key === keys[i]);
    if (row) row.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Backspace' && S.view === 'drive' && S.path) {
    go(driveUrl(parentOf(S.path)));
  }
});

/* ============================================================ chrome wiring */

function init() {
  for (const n of $$('i[data-icon]')) n.replaceWith(icon(n.dataset.icon, n.className));

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-link]');
    if (a && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      go(a.getAttribute('href'));
    }
  });

  $('#newBtn').addEventListener('click', e => showMenu(newMenuEntries(), e.currentTarget));
  $('#fab').addEventListener('click', e => showMenu(newMenuEntries(), e.currentTarget));
  $('#menuBtn').addEventListener('click', () => $('#app').classList.add('nav-open'));
  $('#scrim').addEventListener('click', () => $('#app').classList.remove('nav-open'));

  const input = $('#searchInput');
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) { input.blur(); go('/search?q=' + encodeURIComponent(q)); }
  });
  input.addEventListener('input', () => { $('#searchClear').hidden = !input.value; });
  $('#searchClear').addEventListener('click', () => {
    input.value = '';
    $('#searchClear').hidden = true;
    if (S.view === 'search') go('/drive/');
    else input.focus();
  });

  $('#userBtn').addEventListener('click', e => showMenu([
    { header: `Signed in as ${HD.user}` },
    { label: S.showHidden ? 'Hide hidden files' : 'Show hidden files', icon: 'eye', run: () => {
      S.showHidden = !S.showHidden;
      store.set('hidden', S.showHidden);
      render();
    } },
    { sep: true },
    { label: 'Sign out', icon: 'logout', run: () => { location.href = '/logout'; } },
  ], e.currentTarget));

  route();
  refreshStorage();
}

init();
