// 3D 로비를 돌리는 곳: 그리기, 화질 단계, 포스터 가리키기와 누르기, 느린 기기 판정.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildLobby } from './lobby.js';
import { Walker } from './controls.js';

const NEAR = 6.5;       // 이 거리 안에서만 포스터가 눌린다(미터)
// 느린 기기 판정. 화질은 세 단계: high(반사, 빛 번짐, 조명 전부) > low(반사, 빛 번짐, 곁조명을 끔) > min(해상도까지 절반으로).
// 주소 뒤에 ?quality=high 처럼 붙이면 그 단계로 고정한다(판정을 하지 않는다).
// 목록 화면으로 넘기는 것은 min 에서도 거의 멈춘 듯할 때뿐이다.
const FPS_TO_LOW = 20;  // high 에서 이보다 느리면 low 로
const FPS_TO_MIN = 12;  // low 에서 이보다 느리면 min 으로
const FPS_GIVE_UP = 2.5; // min 에서도 이보다 느리면 목록 화면으로(주소에 ?slow=off 를 붙이면 넘기지 않는다)

export async function createLobby({ canvas, projects, sign, touch, startQuality, fixedQuality, giveUp, hintText, onOpen, onTooSlow, posterAvailable, at }) {
  // 간판과 액자 글자를 그리기 전에 글씨체를 받아 둔다
  try {
    await document.fonts.load('40px Anton');
  } catch {}
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: startQuality !== 'min', powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const world = buildLobby(renderer, projects, sign);
  const camera = new THREE.PerspectiveCamera(touch ? 68 : 62, 1, 0.08, 60);
  if (at) {
    const [x, z, deg] = at.split(',').map(Number);
    if (Number.isFinite(x) && Number.isFinite(z)) Object.assign(world.start, { x, z, yaw: ((deg || 0) * Math.PI) / 180 });
  }

  const hud = {
    hint: document.getElementById('hint'),
    open: document.getElementById('openbtn'),
  };
  const pointer = new THREE.Vector2(0, 0);
  let hasMouse = false;
  let aimed = -1;

  const walker = new Walker(camera, canvas, {
    colliders: world.colliders,
    bounds: world.bounds,
    start: world.start,
    moveStick: document.getElementById('stick-move'),
    lookStick: document.getElementById('stick-look'),
    onPointer(e) {
      if (e.pointerType !== 'mouse') return;
      hasMouse = true;
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    },
    onTap(e) {
      // 누른 자리에 가까운 포스터가 있으면 연다
      const r = canvas.getBoundingClientRect();
      const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const i = pick(p);
      if (i >= 0) onOpen(i);
    },
  });
  hud.open.addEventListener('click', () => {
    if (aimed >= 0) onOpen(aimed);
  });
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Enter' || e.code === 'KeyE') && aimed >= 0 && walker.enabled && !e.target.closest?.('dialog, button, a')) onOpen(aimed);
  });

  // ---------- 포스터 가리키기 ----------
  const ray = new THREE.Raycaster();
  const faces = world.posters.map((p) => p.face);
  function pick(ndc) {
    ray.setFromCamera(ndc, camera);
    ray.far = NEAR + 2;
    const hit = ray.intersectObjects(faces, false)[0];
    if (!hit) return -1;
    const i = hit.object.userData.index;
    return camera.position.distanceTo(world.posters[i].center) <= NEAR ? i : -1;
  }
  const CENTER = new THREE.Vector2(0, 0);
  function updateAim() {
    // 마우스가 있으면 마우스 자리, 없으면(휴대폰) 화면 가운데가 가리키는 곳
    const i = walker.dragging ? -1 : pick(hasMouse && !touch ? pointer : CENTER);
    if (i === aimed) return;
    aimed = i;
    world.highlight(i);
    canvas.classList.toggle('can-open', i >= 0);
    hud.hint.hidden = i < 0;
    hud.open.hidden = i < 0 || !touch;
    if (i >= 0) hud.hint.textContent = `${projects[i].title}  ${hintText}`;
  }

  // ---------- 화질 단계 ----------
  let quality = 'high';
  let composer = null;
  let bloom = null;
  function buildComposer() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(world.scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.42, 0.5, 0.95); // 빛 번짐: 세기, 퍼짐, 문턱
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  const hemiBase = world.hemi.intensity;
  function setQuality(q) {
    quality = q;
    const high = q === 'high';
    const min = q === 'min';
    world.reflector.visible = high;
    world.extraLights.forEach((l) => (l.visible = high));
    world.hemi.intensity = hemiBase * (high ? 1 : 1.5); // 끈 조명만큼 주변광으로 메운다
    renderer.setPixelRatio(high ? Math.min(devicePixelRatio, touch ? 1.5 : 2) : min ? 0.6 : 1);
    canvas.style.imageRendering = min ? 'auto' : '';
    resize();
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (quality === 'high') {
      if (!composer) buildComposer();
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }
  }
  addEventListener('resize', resize);

  // ---------- 포스터 그림: 파일이 있으면 건다 ----------
  const loader = new THREE.TextureLoader();
  projects.forEach(async (p, i) => {
    if (await posterAvailable(p)) loader.load(p.poster, (t) => world.setPoster(i, t));
  });

  // ---------- 돌리기 ----------
  let active = false;
  let paused = false;
  let last = performance.now();
  let frames = 0;
  let acc = 0;
  let warm = 0;
  function frame(now) {
    if (!active) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    const raw = (now - last) / 1000;
    last = now;
    if (!paused) walker.update(dt);
    updateAim();
    if (quality === 'high') composer.render(dt);
    else renderer.render(world.scene, camera);

    // 느린 기기 판정: 단계를 바꾼 뒤 1.5초는 빼고 4초씩 잰다
    if (!watch || raw > 1.5 || document.hidden) return;
    warm += raw;
    if (warm < 1.5) return;
    frames++;
    acc += raw;
    if (acc < 4) return;
    const fps = frames / acc;
    frames = 0;
    acc = 0;
    if (quality === 'high' && fps < FPS_TO_LOW) {
      setQuality('low');
      warm = 0;
    } else if (quality === 'low' && fps < FPS_TO_MIN) {
      setQuality('min');
      warm = 0;
    } else if (quality === 'min' && fps < FPS_GIVE_UP) {
      if (giveUp) onTooSlow();
      watch = false;
    } else if (fps >= FPS_TO_LOW) {
      watch = false; // 충분히 빠르다. 그만 잰다
    }
  }

  let watch = !fixedQuality;
  setQuality(fixedQuality || startQuality);

  return {
    keep3d() {
      giveUp = false; // 사람이 직접 3D 를 골랐다. 느려도 목록으로 넘기지 않는다
    },
    setActive(on, preview = false) {
      walker.enabled = on && !preview && !paused;
      if (on && !active) {
        active = true;
        last = performance.now();
        resize();
        requestAnimationFrame(frame);
      } else if (!on) {
        active = false;
        walker.stop();
      }
    },
    setPaused(p) {
      paused = p;
      walker.stop();
      walker.enabled = active && !p && document.body.classList.contains('mode-3d');
    },
  };
}
