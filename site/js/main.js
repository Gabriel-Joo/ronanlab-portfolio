// 시작점. 메뉴와 목록을 먼저 살리고, 3D 로비는 될 때만 띄운다.
// 주소 뒤에 ?view=list 를 붙이면 목록 화면으로 간다.
// ?slow=off (또는 ?view=3d) 를 붙이면 아무리 느려도 목록 화면으로 넘기지 않는다. 화질만 낮춘다.
// ?enter 를 붙이면 안내를 건너뛰고 바로 로비에 선다.
import { PROJECTS, SIGN, TEXT } from './config.js';
import { initUI, posterAvailable } from './ui.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const forced = params.get('view');
const touch = matchMedia('(pointer: coarse)').matches || params.has('touch'); // ?touch: 데스크톱에서 조이스틱 화면 보기
document.body.classList.toggle('is-touch', touch);

let lobby = null; // 3D 가 떠 있을 때만 채워진다
const ui = initUI({
  onModalChange(open) {
    if (lobby) lobby.setPaused(open);
  },
});

function setMode(mode, notice) {
  document.body.classList.remove('mode-boot', 'mode-3d', 'mode-list', 'mode-intro');
  document.body.classList.add(`mode-${mode}`);
  $('listview').hidden = mode !== 'list';
  $('intro').hidden = mode !== 'intro';
  $('hud').hidden = mode !== '3d';
  const n = $('notice');
  n.hidden = !notice;
  n.textContent = notice || '';
  $('to3d').hidden = !canTry3d(); // 목록 화면 아래의 「3D 로비로 들어가기」
  if (lobby) lobby.setActive(mode === '3d');
}

function webglInfo() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    return { software: /swiftshader|llvmpipe|software|basic render/i.test(name) };
  } catch {
    return null;
  }
}

const gl = webglInfo();
const weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
let keep3d = forced === '3d' || params.get('slow') === 'off';
function canTry3d() {
  return !!gl;
}

$('to3d').addEventListener('click', () => {
  keep3d = true; // 목록에서 직접 고른 3D: 느려도 다시 넘기지 않는다
  if (lobby) lobby.keep3d();
  start3d(true);
});

async function start3d(skipIntro) {
  if (!lobby) {
    try {
      const { createLobby } = await import('./app3d.js');
      lobby = await createLobby({
        canvas: $('scene'),
        projects: PROJECTS,
        sign: SIGN,
        touch,
        // 그래픽카드 없이 CPU 로 그리는 브라우저는 가장 가벼운 단계에서 시작한다
        startQuality: gl.software ? 'min' : weak ? 'low' : 'high',
        giveUp: !keep3d,
        fixedQuality: ['high', 'low', 'min'].includes(params.get('quality')) ? params.get('quality') : null,
        hintText: TEXT.hintOpen,
        onOpen: (i) => ui.openProject(i),
        onTooSlow: () => setMode('list', TEXT.tooSlow),
        posterAvailable,
        at: params.get('at'), // 살펴볼 때 쓰는 시작 자리: ?at=x,z,도는각(도)
      });
    } catch (err) {
      console.error(err);
      setMode('list', TEXT.noWebgl);
      return;
    }
  }
  const enter = $('enter');
  enter.disabled = false;
  enter.textContent = '로비 들어가기';
  if (skipIntro) setMode('3d');
  else {
    setMode('intro');
    lobby.setActive(true, true); // 안내 뒤로 로비가 비쳐 보인다
  }
}

$('enter').addEventListener('click', () => {
  if (lobby) setMode('3d');
});

// ?project=foreman 처럼 붙이면 그 프로젝트 창이 열린 채로 뜬다
const deep = PROJECTS.findIndex((p) => p.id === params.get('project'));
if (deep >= 0) queueMicrotask(() => ui.openProject(deep));

if (forced === 'list') setMode('list');
else if (!gl) setMode('list', TEXT.noWebgl);
else start3d(params.has('enter'));
