// 메뉴 줄, 목록, 소개와 연락처 판, 프로젝트 창. 3D 없이도 혼자 돈다.
import { PROJECTS, LINK_LABELS, ABOUT, CONTACT, TEXT } from './config.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const available = new Map(); // 포스터 그림 파일이 실제로 있는지

// 포스터 파일이 있는지 한 번만 물어본다. 없으면 빈 칸으로 둔다.
export async function posterAvailable(project) {
  if (available.has(project.id)) return available.get(project.id);
  let ok = false;
  try {
    const r = await fetch(project.poster, { method: 'HEAD', cache: 'no-cache' });
    ok = r.ok && (r.headers.get('content-type') || '').startsWith('image/');
  } catch {
    ok = false;
  }
  available.set(project.id, ok);
  return ok;
}

function posterBox(project, index) {
  const box = el('div', 'poster-slot');
  box.append(el('span', 'poster-slot-no', `0${index + 1}`), el('span', 'poster-slot-title', project.title));
  posterAvailable(project).then((ok) => {
    if (!ok) return;
    const img = new Image();
    img.alt = `${project.title} 포스터`;
    img.src = project.poster;
    box.replaceChildren(img);
    box.classList.add('has-image');
  });
  return box;
}

function paragraphs(parent, list) {
  if (!list || !list.length) {
    parent.append(el('p', 'empty', TEXT.empty));
    return;
  }
  for (const t of list) parent.append(el('p', null, t));
}

function cards(parent, onPick) {
  parent.replaceChildren();
  PROJECTS.forEach((p, i) => {
    const b = el('button', 'card');
    b.type = 'button';
    b.append(posterBox(p, i));
    const meta = el('div', 'card-meta');
    meta.append(el('span', 'card-no', `0${i + 1}`), el('strong', null, p.title));
    if (p.tagline) meta.append(el('span', 'card-tagline', p.tagline));
    b.append(meta);
    b.addEventListener('click', () => onPick(i));
    parent.append(b);
  });
}

export function initUI({ onModalChange } = {}) {
  const sheet = $('sheet');
  const win = $('window');
  let sheetKind = null;

  $('brand').textContent = TEXT.brand;
  $('intro-title').textContent = TEXT.introTitle;
  $('intro-lead').textContent = TEXT.introLead;

  const modalOpen = () => sheet.open || win.open;
  const changed = () => onModalChange?.(modalOpen());

  function openProject(index) {
    const p = PROJECTS[index];
    if (!p) return;
    if (sheet.open) sheet.close();
    $('window-no').textContent = `NOW SHOWING 0${index + 1}`;
    $('window-title').textContent = p.title;
    $('window-tagline').textContent = p.tagline || '';
    $('window-tagline').hidden = !p.tagline;
    $('window-poster').replaceChildren(posterBox(p, index));
    const body = $('window-body');
    body.replaceChildren();
    paragraphs(body, p.body);
    const links = $('window-links');
    links.replaceChildren();
    for (const [key, label] of LINK_LABELS) {
      const href = p.links?.[key];
      if (href) {
        const a = el('a', 'btn btn-link', label);
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        links.append(a);
      } // 주소가 없는 단추는 내지 않는다
    }
    if (!win.open) win.showModal();
    changed();
  }

  function openSheet(kind) {
    const body = $('sheet-body');
    body.replaceChildren();
    sheetKind = kind;
    if (kind === 'projects') {
      $('sheet-title').textContent = '프로젝트 소개';
      const grid = el('div', 'cards');
      cards(grid, openProject);
      body.append(grid);
    } else if (kind === 'about') {
      $('sheet-title').textContent = ABOUT.title;
      const self = el('div', 'prose');
      paragraphs(self, ABOUT.body);
      body.append(self);
    } else {
      $('sheet-title').textContent = CONTACT.title;
      if (CONTACT.body.length) paragraphs(body, CONTACT.body);
      if (CONTACT.items.length) {
        const dl = el('dl', 'contact');
        for (const [name, text, href] of CONTACT.items) {
          const dd = el('dd');
          if (href) {
            const a = el('a', null, text);
            a.href = href;
            dd.append(a);
          } else dd.textContent = text;
          dl.append(el('dt', null, name), dd);
        }
        body.append(dl);
      }
    }
    if (win.open) win.close();
    if (!sheet.open) sheet.showModal();
    body.scrollTop = 0;
    changed();
  }

  document.querySelectorAll('[data-open]').forEach((b) => {
    b.addEventListener('click', () => {
      // 목록 화면에서는 프로젝트 목록이 이미 펼쳐져 있으니 판을 또 띄우지 않는다
      if (b.dataset.open === 'projects' && document.body.classList.contains('mode-list')) {
        $('listview').scrollIntoView({ behavior: 'smooth' });
        return;
      }
      openSheet(b.dataset.open);
    });
  });
  for (const d of [sheet, win]) {
    d.addEventListener('close', changed);
    d.addEventListener('click', (e) => {
      if (e.target === d || e.target.closest('[data-close]')) d.close(); // 바깥이나 닫기 단추
    });
  }

  cards($('cards-page'), openProject);

  return {
    openProject,
    openSheet,
    modalOpen,
    get sheetKind() {
      return sheetKind;
    },
  };
}
