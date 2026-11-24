// 로비 장면: 방, 조명, 액자 넷, 그리고 눌리지 않는 배경(매표소, 팝콘 기계, 벨벳 줄, 입간판).
// 길이 단위는 미터. x 는 좌우, z 는 앞뒤(포스터 벽이 z = -9), y 는 높이.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import * as T from './textures.js';

export const ROOM = { w: 14, d: 13, h: 4.4 };

// 액자 자리와 크기. 포스터는 세로 2:3.
export const POSTER = {
  width: 1.6,
  height: 2.4,
  centerY: 1.95,
  xs: [-4.5, -1.5, 1.5, 4.5], // 왼쪽부터 config.js 의 PROJECTS 순서
};

const WARM = 0xffc98a;
const POSTER_GLOW = 0.16; // 걸린 포스터가 스스로 내는 빛(어두운 곳에서도 읽히게)

// 자판기에 든 것. 이름은 모두 지어낸 것이고 실제 상표가 아니다.
const DRINKS = [
  { name: 'RONA COLA', sub: 'CLASSIC 355ml', bg: '#b3151d', ink: '#fff3e0', accent: '#6e0a10', pic: 'bubbles' },
  { name: 'LOBBY LEMON', sub: 'SPARKLING 355ml', bg: '#f2c230', ink: '#1e5a2a', accent: '#d99a12', pic: 'fruit' },
  { name: 'MATINEE', sub: 'ORANGE SODA 355ml', bg: '#f08a24', ink: '#fff6e6', accent: '#c25a10', pic: 'fruit' },
  { name: 'GRAPE REEL', sub: 'GRAPE SODA 355ml', bg: '#5a2d8c', ink: '#f1e4ff', accent: '#33164f', pic: 'star' },
  { name: 'ICE TEA 24', sub: 'PEACH 340ml', bg: '#d98a5a', ink: '#3a1a0a', accent: '#f0c9a0', pic: 'wave' },
  { name: 'CINE COFFEE', sub: 'MILD LATTE 240ml', bg: '#4a2f1e', ink: '#f2dfc2', accent: '#2a180e', pic: 'bean' },
  { name: 'ZERO HOUR', sub: 'ZERO SUGAR 355ml', bg: '#16181c', ink: '#e6e8ee', accent: '#3a3d44', pic: 'bubbles' },
  { name: 'APPLE TAKE', sub: 'APPLE SODA 355ml', bg: '#2e9e55', ink: '#f2fff0', accent: '#1a6a35', pic: 'fruit' },
];
const BOTTLES = [
  { name: 'SPARK', sub: 'WATER 500ml', bg: '#1f6fb8', ink: '#eaf6ff', accent: '#12477a', pic: 'wave', liquid: 0xbfe3f5, cap: 0x1f6fb8 },
  { name: 'GREEN CUT', sub: 'TEA 500ml', bg: '#3a7a3a', ink: '#f0ffe8', accent: '#1e4a20', pic: 'wave', liquid: 0x9fb04a, cap: 0xf2f0ea },
  { name: 'VITA SCENE', sub: 'CITRUS 500ml', bg: '#f2f0ea', ink: '#d9661a', accent: '#f0c060', pic: 'fruit', liquid: 0xf2b23a, cap: 0xd9661a },
];
const SNACKS = [
  { name: 'REEL CHIPS', sub: 'SEA SALT 60g', bg: '#d7262f', ink: '#fff6d6', accent: '#8e1017', pic: 'chips' },
  { name: 'HONEY TWISTS', sub: 'HONEY BUTTER 70g', bg: '#f2c230', ink: '#5a2f0a', accent: '#e09a1a', pic: 'ring' },
  { name: 'SEAWEED CRISP', sub: 'ROASTED 40g', bg: '#1f5a3a', ink: '#eaffea', accent: '#0f3320', pic: 'wave' },
  { name: 'CORN PUFFS', sub: 'CHEESE 65g', bg: '#f08a24', ink: '#fff6e6', accent: '#c2500a', pic: 'star' },
  { name: 'NUTTY MIX', sub: 'ROASTED NUTS 50g', bg: '#6a4426', ink: '#f6e6c8', accent: '#3a2412', pic: 'bean' },
  { name: 'SPICY BITES', sub: 'HOT RICE SNACK 55g', bg: '#a0141c', ink: '#ffd9a0', accent: '#3a0a0c', pic: 'chips' },
  { name: 'BUTTER KERNEL', sub: 'POPCORN 45g', bg: '#1f4fa8', ink: '#fff1b8', accent: '#12306a', pic: 'star' },
];
const BARS = [
  { name: 'MIDNIGHT CHOCO', sub: 'DARK 45g', bg: '#2a1a14', ink: '#f0c060', accent: '#0e0806', pic: 'ring' },
  { name: 'CARAMEL CUT', sub: 'MILK 45g', bg: '#b8742a', ink: '#fff6e0', accent: '#6e3f10', pic: 'wave' },
];

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function box(w, h, d, mat, x, y, z) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
}

// 빛나는 면: 값이 1 을 넘으면 번짐(bloom)이 붙는다.
function lit(r, g, b, opts = {}) {
  const m = new THREE.MeshBasicMaterial(opts);
  m.color.setRGB(r, g, b);
  return m;
}

// 카펫 위에 얹는 반사 층: 거울상을 세로로 길게 번지게 해서 더한다.
const STREAK_SHADER = {
  name: 'CarpetStreaks',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    strength: { value: 0.5 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float strength;
    varying vec4 vUv;
    varying vec3 vWorld;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 uv = vUv.xy / vUv.w;
      // 카펫 결: 자리마다 조금씩 흔들어 거울처럼 또렷하지 않게 한다
      float n = hash(floor(vWorld.xz * 220.0));
      uv.x += (n - 0.5) * 0.004;
      vec3 sum = vec3(0.0);
      float wsum = 0.0;
      for (int i = -14; i <= 14; i++) {
        float f = float(i);
        float wgt = exp(-f * f / 72.0);
        sum += texture2D(tDiffuse, uv + vec2(0.0, f * 0.006)).rgb * wgt;
        wsum += wgt;
      }
      vec3 col = max(sum / wsum - 0.035, 0.0);
      vec3 v = normalize(cameraPosition - vWorld);
      float fres = pow(1.0 - clamp(v.y, 0.0, 1.0), 2.5);
      col *= strength * mix(0.22, 1.0, fres);
      col *= vec3(1.0, 0.62, 0.58);   // 붉은 카펫에 물든 반사
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

function environment(renderer) {
  // 금속이 비출 것: 어두운 방에 따뜻한 조명 몇 점.
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#2a1c16');
  grad.addColorStop(0.45, '#1a1012');
  grad.addColorStop(1, '#240a0c');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#ffd9a0';
  for (let i = 0; i < 12; i++) g.fillRect(8 + i * 21, 14 + (i % 3) * 9, 7, 4);
  g.fillStyle = '#ff5a6e';
  g.fillRect(180, 40, 30, 5);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(t).texture;
  t.dispose();
  pmrem.dispose();
  return env;
}

export function buildLobby(renderer, projects, sign) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070405);
  scene.fog = new THREE.Fog(0x0a0507, 24, 110); // 가까운 것은 또렷하게, 방 끝에서만 아주 조금
  scene.environment = environment(renderer);
  scene.environmentIntensity = 0.5;

  const colliders = []; // 걸어서 지나갈 수 없는 상자 {minX, maxX, minZ, maxZ}
  const block = (x, z, hw, hd) => colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
  const extraLights = []; // 느린 기기에서 끄는 조명
  const { w: W, d: D, h: H } = ROOM;

  // ---------- 재질 ----------
  const mWood = new THREE.MeshStandardMaterial({ map: T.wood([2, 1]), roughness: 0.5, metalness: 0.05 });
  const mBrass = new THREE.MeshStandardMaterial({ color: 0xc9a35a, roughness: 0.28, metalness: 1 });
  const mBlack = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.38, metalness: 0.7 });
  const mVelvet = new THREE.MeshStandardMaterial({ color: 0x7c111a, roughness: 0.92 });
  const mRed = new THREE.MeshStandardMaterial({ color: 0x9a1218, roughness: 0.32, metalness: 0.1 });
  const mGlass = new THREE.MeshStandardMaterial({ color: 0xbfd6e6, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.16, depthWrite: false });
  const mDark = new THREE.MeshStandardMaterial({ color: 0x120c0e, roughness: 0.8 });
  const tBlob = T.blob();
  const tGlow = T.glow();

  const shadow = (x, z, sx, sz, opacity = 0.75) => {
    const m = mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ map: tBlob, transparent: true, opacity, depthWrite: false }), x, 0.012, z);
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 1;
    scene.add(m);
  };

  // ---------- 바닥: 빨간 카펫 + 반사 층 ----------
  const floor = mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ map: T.carpet([6, 5.5]), bumpMap: T.carpetBump([12, 11]), bumpScale: 0.6, roughness: 0.68, metalness: 0.0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const reflector = new Reflector(new THREE.PlaneGeometry(W, D), {
    textureWidth: 1024,
    textureHeight: 1024,
    clipBias: 0.003,
    shader: STREAK_SHADER,
  });
  reflector.material.transparent = true;
  reflector.material.blending = THREE.AdditiveBlending;
  reflector.material.depthWrite = false;
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = 0.006;
  reflector.renderOrder = 2;
  scene.add(reflector);

  // ---------- 벽 ----------
  const mFabric = new THREE.MeshStandardMaterial({ map: T.wallFabric([1, 1]), roughness: 0.9 });
  function wall(width, x, z, rotY) {
    const g = new THREE.Group();
    const fab = mFabric.clone();
    fab.map = mFabric.map.clone();
    fab.map.repeat.set(width / 3, 1);
    fab.map.needsUpdate = true;
    const upper = mesh(new THREE.PlaneGeometry(width, H - 1.1), fab, 0, 1.1 + (H - 1.1) / 2, 0);
    const wd = mWood.clone();
    wd.map = mWood.map.clone();
    wd.map.repeat.set(width / 2.4, 1);
    wd.map.needsUpdate = true;
    const lower = mesh(new THREE.PlaneGeometry(width, 1.1), wd, 0, 0.55, 0);
    const rail = box(width, 0.07, 0.05, mBrass, 0, 1.12, 0.025);
    const skirt = box(width, 0.16, 0.04, mBlack, 0, 0.08, 0.02);
    const crown = box(width, 0.22, 0.1, mBlack, 0, H - 0.11, 0.05);
    g.add(upper, lower, rail, skirt, crown);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    scene.add(g);
  }
  wall(W, 0, -D / 2, 0); // 포스터 벽
  wall(W, 0, D / 2, Math.PI);
  wall(D, -W / 2, 0, Math.PI / 2);
  wall(D, W / 2, 0, -Math.PI / 2);

  // ---------- 천장 ----------
  const ceiling = mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0x0d090b, roughness: 0.95 }), 0, H, 0);
  ceiling.rotation.x = Math.PI / 2;
  scene.add(ceiling);
  for (const z of [-3.2, 3.2]) scene.add(box(W, 0.26, 0.32, mDark, 0, H - 0.13, z));
  for (const x of [-3.4, 3.4]) scene.add(box(0.32, 0.2, D, mDark, x, H - 0.1, 0));

  const mLamp = lit(3.6, 2.6, 1.5);
  const discGeo = new THREE.CircleGeometry(0.15, 20);
  const ringGeo = new THREE.RingGeometry(0.15, 0.22, 24);
  for (const x of [-5.2, -1.7, 1.7, 5.2]) {
    for (const z of [-4.9, -1.6, 1.6, 4.9]) {
      const disc = mesh(discGeo, mLamp, x, H - 0.015, z);
      disc.rotation.x = Math.PI / 2;
      const ring = mesh(ringGeo, mBlack, x, H - 0.014, z);
      ring.rotation.x = Math.PI / 2;
      scene.add(disc, ring);
    }
  }
  // 실제로 바닥을 비추는 등은 몇 개만 둔다(등마다 셈이 든다).
  const ceilingLights = [];
  [[-4.2, -2.2], [4.2, -2.2], [-4.2, 3.4], [4.2, 3.4]].forEach(([x, z], i) => {
    const l = new THREE.PointLight(WARM, 15, 12, 2);
    l.position.set(x, H - 0.5, z);
    scene.add(l);
    ceilingLights.push(l);
    if (i > 1) extraLights.push(l);
  });
  const hemi = new THREE.HemisphereLight(0x5a3c44, 0x220a0a, 0.5);
  scene.add(hemi);

  // ---------- 샹들리에 (가운데) ----------
  {
    const g = new THREE.Group();
    g.position.set(0, H, -0.6);
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), mBrass, 0, -0.35, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.05, 0.1, 16), mBrass, 0, -0.05, 0));
    const flame = lit(3.2, 2.2, 1.0);
    const crystal = new THREE.MeshStandardMaterial({ color: 0xfff1d6, roughness: 0.05, metalness: 0.9, emissive: 0x6a4a1c, emissiveIntensity: 0.6 });
    const tier = (r, y, n) => {
      const ring = mesh(new THREE.TorusGeometry(r, 0.022, 8, 40), mBrass, 0, y, 0);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        g.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), mBrass, x, y + 0.07, z));
        g.add(mesh(new THREE.SphereGeometry(0.034, 8, 6), flame, x, y + 0.16, z));
        const drop = mesh(new THREE.ConeGeometry(0.03, 0.14, 6), crystal, x, y - 0.1, z);
        drop.rotation.x = Math.PI;
        g.add(drop);
        if (i % 2 === 0) {
          const arm = box(0.012, 0.012, r, mBrass, x / 2, y + 0.25 * (1 - r), z / 2);
          arm.rotation.y = -a + Math.PI / 2;
          g.add(arm);
        }
      }
    };
    tier(0.95, -1.05, 12);
    tier(0.55, -0.8, 8);
    const drop = mesh(new THREE.ConeGeometry(0.07, 0.3, 8), crystal, 0, -1.3, 0);
    drop.rotation.x = Math.PI;
    g.add(drop);
    const l = new THREE.PointLight(0xffc27a, 11, 11, 2);
    l.position.set(0, -1.0, 0);
    g.add(l);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tGlow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.28 }));
    s.position.set(0, -0.95, 0);
    s.scale.set(3.0, 2.2, 1);
    g.add(s);
    scene.add(g);
  }

  // ---------- 액자 넷 ----------
  const posters = [];
  const frameW = POSTER.width + 0.26;
  const frameH = POSTER.height + 0.26;
  POSTER.xs.forEach((x, i) => {
    const project = projects[i];
    if (!project) return;
    const g = new THREE.Group();
    g.position.set(x, POSTER.centerY, -D / 2);
    g.add(box(frameW, frameH, 0.1, mBlack, 0, 0, 0.05));
    g.add(box(POSTER.width + 0.07, POSTER.height + 0.07, 0.012, mBrass, 0, 0, 0.102));
    const map = T.posterPlaceholder(project.title, i);
    const face = mesh(
      new THREE.PlaneGeometry(POSTER.width, POSTER.height),
      new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.24, roughness: 0.55, metalness: 0 }),
      0, 0, 0.112,
    );
    face.userData.index = i;
    g.add(face);
    // 이름판
    const plq = mesh(new THREE.PlaneGeometry(0.78, 0.146), new THREE.MeshStandardMaterial({ map: T.plaque(project.title), roughness: 0.35, metalness: 0.75 }), 0, -frameH / 2 - 0.2, 0.03);
    g.add(plq);
    // 위에서 비추는 조명: 벽에서 뻗은 팔, 놋쇠 갓, 빛나는 띠
    const top = frameH / 2;
    g.add(box(0.04, 0.04, 0.55, mBrass, -0.45, top + 0.2, 0.3), box(0.04, 0.04, 0.55, mBrass, 0.45, top + 0.2, 0.3));
    const shade = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.25, 12, 1, false, 0, Math.PI), mBrass, 0, top + 0.2, 0.58);
    shade.rotation.z = Math.PI / 2;
    shade.rotation.y = Math.PI / 2;
    g.add(shade);
    g.add(box(1.15, 0.02, 0.05, lit(6, 4.6, 2.8), 0, top + 0.17, 0.57));
    const spot = new THREE.SpotLight(0xffe2b4, 8, 8, 0.62, 0.8, 2); // 액자 조명 세기(둘째 값). 2026-11-24 42 → 20 → 15 → 8
    spot.position.set(0, top + 0.25, 0.75);
    spot.target.position.set(0, -0.35, 0.05);
    g.add(spot, spot.target);
    scene.add(g);
    posters.push({ project, face, center: new THREE.Vector3(x, POSTER.centerY, -D / 2 + 0.11) });
  });

  function setPoster(index, texture) {
    const p = posters[index];
    if (!p) return;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const mat = p.face.material;
    mat.map = texture;
    mat.emissiveMap = texture;
    mat.emissiveIntensity = POSTER_GLOW;
    mat.color.setScalar(0.5); // 밝은 포스터가 액자 조명에 하얗게 날아가지 않게
    mat.needsUpdate = true;
  }

  // 가리키고 있는 액자는 조금 더 밝게.
  function highlight(index) {
    posters.forEach((p, i) => {
      const base = p.face.material.map && p.face.material.map.isCanvasTexture ? 0.24 : POSTER_GLOW;
      p.face.material.emissiveIntensity = base + (i === index ? 0.14 : 0);
    });
  }

  // 벽에 붙여 세우는 그림판(간판, 자판기 앞면, 표지판). dir: 벽에서 방 쪽을 보는 방향
  const FACE = { '-x': -Math.PI / 2, '+x': Math.PI / 2, '+z': 0, '-z': Math.PI };
  const panel = (w, h, map, x, y, z, dir, glowK = 1) => {
    const m = new THREE.MeshBasicMaterial({ map });
    m.color.setScalar(glowK);
    const p = mesh(new THREE.PlaneGeometry(w, h), m, x, y, z);
    p.rotation.y = FACE[dir];
    return p;
  };

  // ---------- 바닥에 길 내기: 깔개 ----------
  {
    const strip = (w, d, x, z, repeat, rot = 0) => {
      const map = T.rug(repeat);
      const m = mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map, roughness: 0.85 }), x, 0.014, z);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = rot;
      m.renderOrder = 1;
      scene.add(m);
    };
    strip(2.6, 9.6, 0, 0.9, 4);                 // 문에서 포스터 쪽으로
    strip(2.2, 11.4, 0, -5.0, 5, Math.PI / 2);  // 포스터 벽을 따라
  }

  // ---------- 벨벳 줄과 기둥 ----------
  const poleGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.95, 12);
  const baseGeo = new THREE.CylinderGeometry(0.17, 0.2, 0.045, 24);
  const ballGeo = new THREE.SphereGeometry(0.055, 16, 12);
  const post = (x, z) => {
    scene.add(mesh(baseGeo, mBrass, x, 0.023, z), mesh(poleGeo, mBrass, x, 0.5, z), mesh(ballGeo, mBrass, x, 1.0, z));
    block(x, z, 0.16, 0.16);
    shadow(x, z, 0.7, 0.7, 0.6);
  };
  const rope = (ax, az, bx, bz) => {
    const a = new THREE.Vector3(ax, 0.9, az);
    const b = new THREE.Vector3(bx, 0.9, bz);
    const mid = a.clone().lerp(b, 0.5);
    mid.y = 0.7;
    const curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.5).setY(0.76), mid, mid.clone().lerp(b, 0.5).setY(0.76), b]);
    scene.add(mesh(new THREE.TubeGeometry(curve, 24, 0.024, 8), mVelvet));
    block((ax + bx) / 2, (az + bz) / 2, Math.abs(bx - ax) / 2 + 0.05, Math.abs(bz - az) / 2 + 0.05);
  };
  const ropeLine = (pts) => {
    pts.forEach(([x, z]) => post(x, z));
    for (let i = 0; i < pts.length - 1; i++) rope(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  };
  ropeLine([[-1.9, 3.6], [-1.9, 2.1]]); // 깔개 양옆에 한 줄씩
  ropeLine([[1.9, 3.6], [1.9, 2.1]]);
  ropeLine([[4.75, -4.1], [4.75, -2.7], [4.75, -1.3]]); // 매표소 앞 줄 서는 곳

  // ---------- 매표소 창구 (오른쪽 벽) ----------
  {
    const cz = -2.6;
    const wx = W / 2; // 벽
    const g = new THREE.Group();
    g.add(box(1.3, 1.05, 3.6, mWood, wx - 0.65, 0.525, cz));
    g.add(box(1.5, 0.06, 3.8, mBlack, wx - 0.7, 1.08, cz));
    g.add(box(0.03, 0.9, 3.6, mBrass, wx - 1.31, 0.55, cz));
    for (const z of [-1.8, -0.6, 0.6, 1.8]) g.add(box(0.08, 1.5, 0.08, mBrass, wx - 1.3, 1.86, cz + z));
    const glass = mesh(new THREE.PlaneGeometry(3.6, 1.5), mGlass, wx - 1.3, 1.86, cz);
    glass.rotation.y = -Math.PI / 2;
    g.add(glass);
    g.add(box(1.4, 0.5, 3.8, mRed, wx - 0.7, 2.86, cz));
    g.add(panel(2.4, 0.33, T.label('TICKETS', { w: 768, h: 108 }), wx - 1.405, 2.86, cz, '-x', 1.5));
    const back = mesh(new THREE.PlaneGeometry(3.6, 1.5), lit(0.13, 0.07, 0.035), wx - 0.06, 1.86, cz);
    back.rotation.y = -Math.PI / 2;
    g.add(back);
    for (const z of [-1.0, 1.2]) {
      g.add(box(0.05, 0.36, 0.56, mBlack, wx - 0.95, 1.36, cz + z));
      g.add(box(0.2, 0.1, 0.2, mBlack, wx - 0.9, 1.14, cz + z));
      const scr = mesh(new THREE.PlaneGeometry(0.5, 0.3), lit(0.5, 0.9, 1.3), wx - 0.92, 1.36, cz + z);
      scr.rotation.y = Math.PI / 2;
      g.add(scr);
    }
    // 창구 안 직원 한 사람: 어두운 안쪽에 서 있는 윤곽
    {
      const p = new THREE.Group();
      p.position.set(wx - 0.5, 0, cz + 0.1);
      const mSkin = new THREE.MeshStandardMaterial({ color: 0xb98a6a, roughness: 0.8 });
      const mVest = new THREE.MeshStandardMaterial({ color: 0x5c0f16, roughness: 0.8 });
      const mShirt = new THREE.MeshStandardMaterial({ color: 0xd9d2c4, roughness: 0.8 });
      p.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.62, 12), mVest, 0, 1.3, 0));
      p.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), mShirt, 0, 1.64, 0));
      p.add(mesh(new THREE.SphereGeometry(0.115, 14, 12), mSkin, 0, 1.78, 0));
      p.add(mesh(new THREE.CylinderGeometry(0.118, 0.122, 0.07, 14), mVest, 0, 1.87, 0));
      p.add(box(0.1, 0.02, 0.2, mVest, -0.14, 1.845, 0)); // 모자 챙
      for (const z of [-0.23, 0.23]) {
        const arm = mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.52, 8), mShirt, -0.1, 1.28, z);
        arm.rotation.z = -0.5;
        p.add(arm);
      }
      p.add(box(0.03, 0.05, 0.05, mBrass, -0.17, 1.42, 0.08)); // 이름표
      g.add(p);
    }
    const inside = new THREE.PointLight(0xffb878, 3.5, 5, 2);
    inside.position.set(wx - 0.75, 2.3, cz);
    g.add(inside);
    extraLights.push(inside);
    // 네온 간판
    g.add(box(0.06, 1.12, 4.0, mBlack, wx - 0.05, 3.72, cz));
    const neonMat = new THREE.MeshBasicMaterial({ map: T.neon(sign.heading), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    neonMat.color.setScalar(2.4);
    const neon = mesh(new THREE.PlaneGeometry(3.9, 0.975), neonMat, wx - 0.1, 3.72, cz);
    neon.rotation.y = -Math.PI / 2;
    g.add(neon);
    const neonLight = new THREE.PointLight(0xff3358, 30, 10, 2);
    neonLight.position.set(wx - 1.0, 3.6, cz);
    g.add(neonLight);
    extraLights.push(neonLight);
    scene.add(g);
    block(wx - 0.7, cz, 0.78, 1.95);
    shadow(wx - 1.3, cz, 1.4, 4.2, 0.6);
  }

  // ---------- 매점 진열대 (왼쪽 벽): 팝콘, 나초, 음료 컵, 핫도그 ----------
  {
    const cz = -2.7;
    const wx = -W / 2;
    const g = new THREE.Group();
    g.add(box(1.15, 1.0, 3.9, mWood, wx + 0.58, 0.5, cz));
    g.add(box(1.25, 0.06, 4.0, mBlack, wx + 0.6, 1.03, cz));
    g.add(box(0.03, 0.86, 3.9, mBrass, wx + 1.16, 0.52, cz));
    // 위 머리판과 차림판
    g.add(box(1.3, 0.5, 4.0, mRed, wx + 0.65, 2.86, cz));
    g.add(panel(2.6, 0.33, T.label('SNACK BAR', { w: 768, h: 100 }), wx + 1.305, 2.86, cz, '+x', 1.5));
    // 차림표: 지어낸 품목과 값(원)
    g.add(panel(3.1, 1.55, T.menu('SNACK BAR MENU', [
      [['POPCORN', [['버터 팝콘 L', '6,500'], ['카라멜 팝콘 L', '7,000'], ['반반 팝콘 L', '7,500']]],
       ['HOT FOOD', [['치즈 나초', '5,500'], ['클래식 핫도그', '5,000'], ['칠리 핫도그', '5,800']]]],
      [['DRINKS', [['탄산음료 L', '3,500'], ['아이스티 L', '3,800'], ['아이스 아메리카노', '4,000']]],
       ['COMBO', [['솔로 콤보', '9,500'], ['커플 콤보', '13,500'], ['패밀리 콤보', '19,000']]]],
    ], '콤보는 팝콘과 음료를 함께 드립니다'), wx + 0.03, 1.86, cz - 0.3, '+x', 0.8));
    // 유리 가림막
    const guard = mesh(new THREE.PlaneGeometry(3.7, 0.42), mGlass, wx + 1.1, 1.28, cz);
    guard.rotation.y = Math.PI / 2;
    g.add(guard);
    for (const z of [-1.85, 1.85]) g.add(box(0.03, 0.44, 0.03, mBrass, wx + 1.1, 1.27, cz + z));

    const top = 1.06;
    let seed = 9;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const cornGeo = new THREE.IcosahedronGeometry(0.03, 0);
    const mCorn = new THREE.MeshStandardMaterial({ color: 0xf7e2a0, roughness: 0.8, emissive: 0x6a4a10, emissiveIntensity: 0.45 });
    // 흩어 쌓기(팝콘 기계 안에서 쓴다)
    const heap = (x, y, z, n, r, hgt, geo = cornGeo, mat = mCorn) => {
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const d = Math.sqrt(rnd()) * r;
        const k = mesh(geo, mat, x + Math.cos(a) * d, y + rnd() * hgt * (1 - d / r * 0.7), z + Math.sin(a) * d);
        k.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        g.add(k);
      }
    };

    // ----- 차림표의 음식을 진열대에 올린다. 어두운 로비에서도 보이게 재질마다 제 빛을 조금 낸다.
    const food = (color, emissive = 0.3, rough = 0.6) => new THREE.MeshStandardMaterial({ color, roughness: rough, emissive: color, emissiveIntensity: emissive });
    const mPaper = food(0xf4efe6, 0.25, 0.8);
    const mChecker = new THREE.MeshStandardMaterial({ map: T.checker(), roughness: 0.8, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
    mChecker.emissive.set(0x332222);
    mChecker.emissiveIntensity = 1;
    const fx = wx + 0.84; // 앞줄
    const bx = wx + 0.47; // 뒷줄(단 위)
    const step = 0.13;
    g.add(box(0.36, step, 3.0, mBlack, bx, top + step / 2, cz - 0.35)); // 뒷줄을 올리는 단
    g.add(box(0.37, 0.012, 3.02, mBrass, bx, top + step + 0.006, cz - 0.35));

    // 팝콘 알을 한꺼번에 그리기: 색이 조금씩 다른 알을 통 위로 수북이
    const kernels = (list, colors, emissiveColor) => {
      const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.019, 0), new THREE.MeshStandardMaterial({ roughness: 0.85, emissive: emissiveColor, emissiveIntensity: 0.5 }), list.length);
      const d = new THREE.Object3D();
      const col = new THREE.Color();
      list.forEach(([x, y, z], k) => {
        d.position.set(x, y, z);
        d.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
        d.scale.set(0.8 + rnd() * 0.6, 0.7 + rnd() * 0.5, 0.8 + rnd() * 0.6);
        d.updateMatrix();
        im.setMatrixAt(k, d.matrix);
        im.setColorAt(k, col.set(colors[(rnd() * colors.length) | 0]));
      });
      g.add(im);
    };
    const BUTTER = ['#fff3c4', '#f7e2a0', '#f2d27a', '#fff8dc'];
    const CARAMEL = ['#c98a3a', '#a8641e', '#8a4f16', '#d9a04a'];
    const tubMap = T.tub();
    const tubMat = new THREE.MeshStandardMaterial({ map: tubMap, roughness: 0.7, emissive: 0xffffff, emissiveMap: tubMap, emissiveIntensity: 0.22, side: THREE.DoubleSide });
    // 팝콘 통: 통 위로 넘치게 쌓고 몇 알은 옆에 떨어뜨린다. mix: 0 버터, 1 카라멜, 0.5 반반
    const tub = (x, y, z, k, mix) => {
      const r = 0.1 * k, h = 0.25 * k;
      g.add(mesh(new THREE.CylinderGeometry(r, r * 0.72, h, 24, 1, true), tubMat, x, y + h / 2, z));
      g.add(mesh(new THREE.CylinderGeometry(r * 0.72, r * 0.72, 0.006, 20), mPaper, x, y + 0.003, z));
      const butter = [], caramel = [];
      for (let i = 0; i < 95; i++) {
        const a = rnd() * Math.PI * 2;
        const d = Math.sqrt(rnd()) * r * 1.02;
        const dome = Math.cos((d / (r * 1.02)) * Math.PI / 2);
        const p = [x + Math.cos(a) * d, y + h - 0.012 + rnd() * 0.085 * k * dome + 0.006, z + Math.sin(a) * d];
        const car = mix === 1 || (mix === 0.5 && Math.cos(a) > 0);
        (car ? caramel : butter).push(p);
      }
      for (let i = 0; i < 6; i++) { // 흘린 알
        const a = rnd() * Math.PI * 2;
        const p = [x + Math.cos(a) * (r + 0.02 + rnd() * 0.07), y + 0.014, z + Math.sin(a) * (r + 0.02 + rnd() * 0.07)];
        (mix === 1 ? caramel : butter).push(p);
      }
      if (butter.length) kernels(butter, BUTTER, 0x6a4a10);
      if (caramel.length) kernels(caramel, CARAMEL, 0x3a1c06);
    };
    // 빨대: 빨강 하양 줄무늬
    const strawMat = new THREE.MeshStandardMaterial({ map: T.stripes(), roughness: 0.6, emissive: 0x442222, emissiveIntensity: 1 });
    strawMat.map.repeat.set(1, 6);
    strawMat.map.wrapT = THREE.RepeatWrapping;
    const mLid = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, transparent: true, opacity: 0.62, emissive: 0x555555 });
    const straw = (x, y, z, len = 0.15, mat = strawMat) => {
      const s = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, len, 8), mat, x + 0.012, y + len / 2 - 0.03, z);
      s.rotation.z = -0.2;
      s.rotation.x = 0.1;
      g.add(s);
    };
    // 종이컵 음료: 컵, 둥근 뚜껑, 꽂힌 빨대
    const paperCup = (x, y, z, k, map) => {
      const h = 0.17 * k;
      g.add(mesh(new THREE.CylinderGeometry(0.05 * k, 0.037 * k, h, 20), new THREE.MeshStandardMaterial({ map, roughness: 0.6, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.22 }), x, y + h / 2, z));
      g.add(mesh(new THREE.CylinderGeometry(0.053 * k, 0.053 * k, 0.012, 20), mLid, x, y + h + 0.004, z));
      const dome = mesh(new THREE.SphereGeometry(0.05 * k, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), mLid, x, y + h + 0.008, z);
      dome.scale.y = 0.55;
      g.add(dome);
      straw(x, y + h + 0.03, z);
    };
    // 투명 컵 음료(아이스 아메리카노, 아이스티): 안에 음료와 얼음이 비친다
    const clearCup = (x, y, z, liquid) => {
      const h = 0.16;
      g.add(mesh(new THREE.CylinderGeometry(0.043, 0.032, h * 0.8, 18), food(liquid, 0.35, 0.3), x, y + h * 0.4 + 0.004, z));
      for (let i = 0; i < 5; i++) {
        const ice = box(0.02, 0.02, 0.02, new THREE.MeshStandardMaterial({ color: 0xeaf4ff, roughness: 0.1, transparent: true, opacity: 0.7, emissive: 0x334455 }), x + (rnd() - 0.5) * 0.045, y + h * 0.78 + rnd() * 0.012, z + (rnd() - 0.5) * 0.045);
        ice.rotation.set(rnd(), rnd(), rnd());
        g.add(ice);
      }
      g.add(mesh(new THREE.CylinderGeometry(0.048, 0.035, h, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, emissive: 0x222222 }), x, y + h / 2, z));
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 18), mLid, x, y + h + 0.004, z));
      straw(x, y + h + 0.02, z, 0.16, food(0x1a1a1a, 0.1));
    };
    // 종이 받침
    const tray = (x, y, z, w, d) => g.add(box(w, 0.022, d, mChecker, x, y + 0.011, z), box(w + 0.012, 0.006, d + 0.012, mPaper, x, y + 0.003, z));
    // 나초: 세모 과자 더미 위에 치즈를 흘리고, 소스 그릇 둘을 곁에
    const nachos = (x, y, z) => {
      tray(x, y, z, 0.3, 0.22);
      const n = 34;
      const chips = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.036, 0.036, 0.004, 3), food(0xe9b23c, 0.35, 0.75), n);
      const d = new THREE.Object3D();
      const col = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const rr = Math.sqrt(rnd()) * 0.085;
        d.position.set(x - 0.04 + Math.cos(a) * rr, y + 0.03 + rnd() * 0.055 * (1 - rr / 0.085), z + Math.sin(a) * rr * 1.1);
        d.rotation.set((rnd() - 0.5) * 1.6, rnd() * 6, (rnd() - 0.5) * 1.6);
        d.scale.setScalar(1);
        d.updateMatrix();
        chips.setMatrixAt(i, d.matrix);
        chips.setColorAt(i, col.set(['#e9b23c', '#f2c04a', '#d99a2a'][i % 3]));
      }
      g.add(chips);
      const mCheese = food(0xf59a1c, 0.5, 0.3);
      for (let i = 0; i < 9; i++) { // 흘러내린 치즈
        const b = mesh(new THREE.SphereGeometry(0.02, 10, 8), mCheese, x - 0.04 + (rnd() - 0.5) * 0.11, y + 0.07 + rnd() * 0.02, z + (rnd() - 0.5) * 0.12);
        b.scale.set(1 + rnd(), 0.35, 1 + rnd());
        g.add(b);
      }
      const mPepper = food(0x3f8a2e, 0.35);
      for (let i = 0; i < 5; i++) { // 할라피뇨 조각
        const t = mesh(new THREE.TorusGeometry(0.009, 0.004, 6, 10), mPepper, x - 0.04 + (rnd() - 0.5) * 0.1, y + 0.085, z + (rnd() - 0.5) * 0.1);
        t.rotation.x = Math.PI / 2 + (rnd() - 0.5);
        g.add(t);
      }
      for (const [dz, col2] of [[-0.055, 0xf59a1c], [0.055, 0xb3231c]]) { // 치즈 소스, 살사
        g.add(mesh(new THREE.CylinderGeometry(0.034, 0.027, 0.04, 14, 1, true), mPaper, x + 0.105, y + 0.042, z + dz));
        g.add(mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.006, 14), food(col2, 0.5, 0.25), x + 0.105, y + 0.056, z + dz));
      }
    };
    // 핫도그: 갈라진 빵, 소시지, 지그재그 소스. chili 면 위에 칠리와 치즈를 얹는다
    const hotdog = (x, y, z, chili) => {
      tray(x, y, z, 0.11, 0.2);
      const along = (m) => {
        m.rotation.x = Math.PI / 2;
        return m;
      };
      const mBun = food(0xd39a52, 0.3, 0.8);
      for (const dx of [-0.02, 0.02]) g.add(along(mesh(new THREE.CapsuleGeometry(0.022, 0.12, 4, 10), mBun, x + dx, y + 0.042, z)));
      g.add(along(mesh(new THREE.CapsuleGeometry(0.019, 0.15, 4, 10), food(0x9a3a22, 0.35, 0.45), x, y + 0.058, z)));
      const zig = (color, phase, lift) => {
        const pts = [];
        for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3(x + Math.sin(i * 1.6 + phase) * 0.011, y + 0.078 + lift, z - 0.07 + i * 0.0117));
        g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.0035, 6), food(color, 0.5, 0.3)));
      };
      if (chili) {
        const mChili = food(0x6e2a14, 0.35, 0.7);
        for (let i = 0; i < 16; i++) g.add(mesh(new THREE.SphereGeometry(0.008 + rnd() * 0.004, 6, 5), mChili, x + (rnd() - 0.5) * 0.02, y + 0.078 + rnd() * 0.006, z - 0.065 + rnd() * 0.13));
        const mShred = food(0xf7c63a, 0.5);
        for (let i = 0; i < 14; i++) {
          const s = box(0.003, 0.003, 0.02, mShred, x + (rnd() - 0.5) * 0.024, y + 0.09, z - 0.06 + rnd() * 0.12);
          s.rotation.y = rnd() * 3;
          g.add(s);
        }
      } else {
        zig(0xf2c21a, 0, 0);
        zig(0xc4202d, 1.6, 0.001);
      }
    };
    // 이름표
    const card = (name, price, x, z) => {
      const map = T.priceCard(name, price);
      const c = mesh(new THREE.PlaneGeometry(0.17, 0.085), new THREE.MeshBasicMaterial({ map }), x, top + 0.05, z);
      c.material.color.setScalar(0.8);
      c.rotation.y = Math.PI / 2;
      c.rotateX(-0.3);
      g.add(c);
    };

    const yb = top + step + 0.012; // 뒷줄 높이
    // 팝콘 셋
    tub(bx, yb, cz - 1.62, 1, 0);
    tub(bx, yb, cz - 1.33, 1, 1);
    tub(bx, yb, cz - 1.04, 1, 0.5);
    card('버터 팝콘 L', '6,500', wx + 1.0, cz - 1.62);
    card('카라멜 팝콘 L', '7,000', wx + 1.0, cz - 1.33);
    card('반반 팝콘 L', '7,500', wx + 1.0, cz - 1.04);
    tub(fx - 0.08, top, cz - 1.48, 0.62, 0);
    tub(fx - 0.08, top, cz - 1.18, 0.62, 1);
    // 음료 셋
    paperCup(bx, yb, cz - 0.7, 1.1, T.cup('#b8141c', '#fff3e0', 'COLA'));
    clearCup(bx, yb, cz - 0.52, 0xc9722a); // 아이스티
    clearCup(bx, yb, cz - 0.34, 0x2a140a); // 아이스 아메리카노
    paperCup(fx - 0.1, top, cz - 0.6, 0.85, T.cup('#f2c230', '#7a0c12', 'LEMON'));
    card('탄산음료 L', '3,500', wx + 1.0, cz - 0.72);
    card('아이스티 L', '3,800', wx + 1.0, cz - 0.52);
    card('아메리카노', '4,000', wx + 1.0, cz - 0.32);
    // 나초
    nachos(fx - 0.12, top, cz + 0.02);
    card('치즈 나초', '5,500', wx + 1.0, cz + 0.02);
    // 핫도그 둘
    hotdog(fx - 0.14, top, cz + 0.42, false);
    hotdog(fx - 0.14, top, cz + 0.62, true);
    card('클래식 핫도그', '5,000', wx + 1.0, cz + 0.4);
    card('칠리 핫도그', '5,800', wx + 1.0, cz + 0.62);
    // 커플 콤보: 쟁반에 팝콘 하나와 음료 둘
    g.add(box(0.3, 0.014, 0.42, mBlack, bx, yb + 0.007, cz + 0.42));
    tub(bx - 0.02, yb + 0.014, cz + 0.3, 0.8, 0);
    paperCup(bx + 0.02, yb + 0.014, cz + 0.47, 0.8, T.cup('#b8141c', '#fff3e0', 'COLA'));
    paperCup(bx + 0.02, yb + 0.014, cz + 0.57, 0.8, T.cup('#1f4fa8', '#eaf2ff', 'SODA'));
    card('커플 콤보', '13,500', wx + 1.0, cz + 0.86);
    // 팝콘 기계: 진열대 끝에 올려 둔다
    {
      const mx = wx + 0.6;
      const mz = cz - 1.5 + 3.05; // 문 쪽 끝
      g.add(box(0.62, 0.06, 0.62, mRed, mx, top + 0.03, mz));
      g.add(box(0.6, 0.62, 0.6, mGlass, mx, top + 0.37, mz));
      for (const [px, pz] of [[0.3, 0.3], [0.3, -0.3], [-0.3, 0.3], [-0.3, -0.3]]) g.add(box(0.03, 0.62, 0.03, mBrass, mx + px, top + 0.37, mz + pz));
      heap(mx, top + 0.07, mz, 90, 0.27, 0.2, new THREE.IcosahedronGeometry(0.04, 0));
      const steel = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.2, metalness: 1 });
      g.add(mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.15, 16), steel, mx, top + 0.52, mz));
      g.add(box(0.66, 0.18, 0.66, mRed, mx, top + 0.77, mz));
      g.add(panel(0.6, 0.13, T.label('POPCORN', { w: 512, h: 110, bg: '#a3131b' }), mx + 0.332, top + 0.77, mz, '+x', 1.6));
      g.add(box(0.42, 0.012, 0.42, lit(4, 3, 1.6), mx, top + 0.675, mz));
    }
    // 진열대를 비추는 빛(전에 팝콘 기계 안에 있던 등 하나)
    const l = new THREE.PointLight(0xffc070, 9, 5, 2);
    l.position.set(wx + 1.0, 2.2, cz);
    g.add(l);
    extraLights.push(l);
    scene.add(g);
    block(wx + 0.6, cz, 0.68, 2.05);
    shadow(wx + 1.15, cz, 1.3, 4.4, 0.6);
  }

  // ---------- 가운데: 둥근 벨벳 의자와 화분 ----------
  const mLeaf = new THREE.MeshStandardMaterial({ color: 0x24512c, roughness: 0.75, side: THREE.DoubleSide });
  const mLeaf2 = new THREE.MeshStandardMaterial({ color: 0x2f6a36, roughness: 0.75, side: THREE.DoubleSide });
  const mPot = new THREE.MeshStandardMaterial({ color: 0x1a1414, roughness: 0.45, metalness: 0.3 });
  const mTrunk = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.9 });
  const leafGeo = new THREE.ConeGeometry(0.11, 1, 4);
  leafGeo.scale(1, 1, 0.16);
  leafGeo.translate(0, 0.5, 0);
  // 잎이 뻗는 화분(야자 꼴)
  const palm = (x, y, z, scale = 1, leaves = 11) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.scale.setScalar(scale);
    g.add(mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.42, 16), mPot, 0, 0.21, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.03, 16), mBrass, 0, 0.42, 0));
    for (let i = 0; i < leaves; i++) {
      const a = (i / leaves) * Math.PI * 2 + (i % 2) * 0.3;
      const leaf = mesh(leafGeo, i % 3 ? mLeaf : mLeaf2, 0, 0.4, 0);
      leaf.scale.setScalar(0.9 + (i % 4) * 0.16);
      leaf.rotation.set(0, a, 0);
      leaf.rotateX(0.35 + (i % 3) * 0.24);
      g.add(leaf);
    }
    scene.add(g);
  };
  // 줄기가 있는 나무
  const tree = (x, z, height = 2.3) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 16), mPot, 0, 0.25, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.045, 0.06, height - 0.6, 8), mTrunk, 0, 0.5 + (height - 0.6) / 2, 0));
    const blobGeo = new THREE.IcosahedronGeometry(0.42, 0);
    [[0, height, 0, 1], [0.3, height - 0.28, 0.1, 0.8], [-0.28, height - 0.2, -0.15, 0.85], [0.05, height - 0.45, -0.3, 0.7], [-0.1, height + 0.3, 0.12, 0.7]].forEach(([dx, y, dz, k], i) => {
      const b = mesh(blobGeo, i % 2 ? mLeaf : mLeaf2, dx, y, dz);
      b.scale.setScalar(k);
      b.rotation.set(i, i * 2, i * 3);
      g.add(b);
    });
    scene.add(g);
    block(x, z, 0.3, 0.3);
    shadow(x, z, 1.5, 1.5, 0.7);
  };
  {
    const g = new THREE.Group();
    g.position.set(0, 0, -0.6);
    g.add(mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.3, 40), mWood, 0, 0.15, 0));
    g.add(mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.16, 40), mVelvet, 0, 0.38, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.36, 0.5, 0.4, 24), mVelvet, 0, 0.64, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.03, 24), mBrass, 0, 0.85, 0));
    g.add(mesh(new THREE.TorusGeometry(1.0, 0.02, 8, 48), mBrass, 0, 0.03, 0).rotateX(Math.PI / 2));
    scene.add(g);
    palm(0, 0.84, -0.6, 0.3, 11); // 포스터를 가리지 않게 낮은 화분
    block(0, -0.6, 1.02, 1.02);
    shadow(0, -0.6, 3.2, 3.2, 0.75);
  }
  palm(-6.3, 0, -5.75, 1.25);
  palm(6.3, 0, -5.75, 1.25);
  block(-6.3, -5.75, 0.3, 0.3);
  block(6.3, -5.75, 0.3, 0.3);
  tree(-2.5, 5.85);
  tree(3.6, 5.85);
  palm(-6.35, 0, 0.3, 1.1);
  block(-6.35, 0.3, 0.28, 0.28);

  // ---------- 입간판 ----------
  {
    const g = new THREE.Group();
    g.position.set(-4.3, 0, -0.7);
    g.rotation.y = 0.55;
    g.add(box(0.98, 2.0, 0.08, mBlack, 0, 1.12, 0));
    const face = T.standee(sign.heading, projects.map((p) => p.title), sign.footer);
    const board = mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshStandardMaterial({ map: face, emissiveMap: face, emissive: 0xffffff, emissiveIntensity: 1.15, roughness: 0.5 }), 0, 1.14, 0.042);
    g.add(board);
    g.add(box(1.1, 0.06, 0.5, mBrass, 0, 0.03, 0), box(0.06, 0.14, 0.06, mBrass, -0.4, 0.1, 0), box(0.06, 0.14, 0.06, mBrass, 0.4, 0.1, 0));
    scene.add(g);
    block(-4.3, -0.7, 0.55, 0.4);
    shadow(-4.3, -0.7, 1.7, 1.2, 0.7);
  }

  // ---------- 자판기 둘과 쓰레기통 (오른쪽 벽, 문 쪽) ----------
  {
    const wx = W / 2;
    // 자판기: 유리창 안에 줄 맞춰 선 물건, 아래 꺼내는 칸, 옆에 동전과 지폐 넣는 자리, 위에 빛나는 간판.
    // 앞면이 +z 를 보게 지은 다음 통째로 돌려 벽에 붙인다.
    const VEND = 1.3; // 자판기 크기 배율(1 이면 폭 1m, 높이 1.95m)
    const machine = (z, title, body, palette, kind) => {
      const g = new THREE.Group();
      const mBody = new THREE.MeshStandardMaterial({ color: body, roughness: 0.42, metalness: 0.35 });
      const mTrim = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.5, metalness: 0.4 });
      // 몸통: 뒤쪽 통 + 앞쪽 테(위, 아래, 왼쪽 띠, 오른쪽 기둥). 가운데는 진열 칸으로 뚫려 있다
      g.add(box(1.0, 1.95, 0.5, mBody, 0, 0.975, -0.15));
      g.add(box(1.0, 0.32, 0.3, mBody, 0, 1.79, 0.25), box(1.0, 0.55, 0.3, mBody, 0, 0.275, 0.25));
      g.add(box(0.04, 1.08, 0.3, mBody, -0.48, 1.09, 0.25), box(0.3, 1.08, 0.3, mBody, 0.35, 1.09, 0.25));
      for (const x of [-0.42, 0.42]) g.add(box(0.08, 0.05, 0.6, mTrim, x, 0.025, 0));
      // 위 간판
      const signMap = T.label(title, { w: 512, h: 128, bg: body });
      const signMat = new THREE.MeshBasicMaterial({ map: signMap });
      signMat.color.setScalar(1.35);
      g.add(mesh(new THREE.PlaneGeometry(0.9, 0.225), signMat, 0, 1.79, 0.402));
      // 진열 칸: 안쪽은 어둡고 줄마다 위에서 빛이 떨어진다. 물건은 조금씩 어긋나게 선다.
      const wx0 = -0.13, ww = 0.66, wy0 = 1.09, wh = 1.08; // 창 가운데와 크기
      const rows = 5;
      const rowH = wh / rows;
      g.add(mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: T.shelfBack(rows) }), wx0, wy0, 0.105));
      for (const sx of [-1, 1]) g.add(box(0.012, wh, 0.28, lit(0.05, 0.05, 0.06), wx0 + sx * (ww / 2 - 0.006), wy0, 0.25));
      let seed = title.length * 131 + 7;
      const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      const places = new Map(); // 그릴 것마다 놓을 자리들
      const put = (key, x, y, z, ry = 0, rz = 0, rx = 0, sc = 1) => {
        if (!places.has(key)) places.set(key, []);
        places.get(key).push([x, y, z, ry, rz, rx, sc]);
      };
      for (let r = 0; r < rows; r++) {
        const sy = wy0 - wh / 2 + 0.02 + r * rowH; // 선반 윗면
        g.add(box(ww, 0.014, 0.27, mTrim, wx0, sy - 0.007, 0.245));
        g.add(box(ww, 0.03, 0.008, lit(0.85, 0.8, 0.66), wx0, sy - 0.004, 0.384)); // 값표 띠
        g.add(box(ww - 0.04, 0.008, 0.02, lit(1.5, 1.35, 1.1), wx0, sy + rowH - 0.03, 0.37)); // 줄 위의 등
      }
      if (kind === 'cans') {
        // 한 줄 다섯 칸. 칸마다 같은 음료가 앞뒤로 셋씩 줄지어 선다(번호판 01 부터 25 와 맞는다)
        const cols = 5;
        const FRONT = -Math.PI / 2; // 이름이 앞을 보게
        for (let r = 0; r < rows; r++) {
          const sy = wy0 - wh / 2 + 0.02 + r * rowH;
          for (let c = 0; c < cols; c++) {
            const x = wx0 - ww / 2 + (c + 0.5) * (ww / cols);
            const design = (r * cols + c) % DRINKS.length;
            for (let dpt = 0; dpt < 3; dpt++) {
              const z = 0.335 - dpt * 0.07;
              const yaw = FRONT + (rnd() - 0.5) * 0.16;
              if (r === 0) {
                put(`bottle${c % 3}`, x, sy, z, yaw);
              } else {
                put(`can${design}`, x, sy, z, yaw);
                put('cantop', x, sy, z, rnd() * 6.28);
              }
            }
          }
        }
        const mcMetal = T.matcap(1);
        const bodyGeo = new THREE.CylinderGeometry(0.033, 0.033, 0.104, 24, 1, true);
        bodyGeo.translate(0, 0.062, 0);
        // 캔 위아래: 좁아지는 어깨, 뚜껑, 테, 따는 고리
        const silver = new THREE.MeshMatcapMaterial({ matcap: mcMetal, color: 0xd6dade });
        const parts = [];
        const add = (geo, x, y, z, rx = 0) => {
          geo.rotateX(rx);
          geo.translate(x, y, z);
          parts.push(geo);
        };
        add(new THREE.CylinderGeometry(0.0275, 0.033, 0.012, 24, 1, true), 0, 0.12, 0);
        add(new THREE.CylinderGeometry(0.033, 0.029, 0.01, 24, 1, true), 0, 0.005, 0);
        add(new THREE.CylinderGeometry(0.0262, 0.0262, 0.002, 24), 0, 0.1245, 0);
        add(new THREE.TorusGeometry(0.0272, 0.0018, 6, 24), 0, 0.126, 0, Math.PI / 2);
        add(new THREE.TorusGeometry(0.0075, 0.0022, 6, 14), 0.006, 0.1262, 0, Math.PI / 2);
        add(new THREE.BoxGeometry(0.012, 0.0018, 0.009), -0.006, 0.1262, 0);
        const instanced = (geo, mat, list) => {
          const im = new THREE.InstancedMesh(geo, mat, list.length);
          const d = new THREE.Object3D();
          list.forEach(([x, y, z, ry, rz, rx, sc], k) => {
            d.position.set(x, y, z);
            d.rotation.set(rx, ry, rz);
            d.scale.setScalar(sc);
            d.updateMatrix();
            im.setMatrixAt(k, d.matrix);
          });
          g.add(im);
        };
        for (const [key, list] of places) {
          if (key.startsWith('can') && key !== 'cantop') {
            const dsg = DRINKS[+key.slice(3)];
            instanced(bodyGeo, new THREE.MeshMatcapMaterial({ matcap: mcMetal, map: T.canLabel(dsg) }), list);
          } else if (key === 'cantop') {
            parts.forEach((geo) => instanced(geo, silver, list));
          } else {
            // 페트병: 몸통(띠지), 어깨, 목, 뚜껑
            const b = BOTTLES[+key.slice(6)];
            const mcSoft = T.matcap(0.7);
            const liquid = new THREE.MeshMatcapMaterial({ matcap: mcSoft, color: b.liquid });
            const geoBody = new THREE.CylinderGeometry(0.031, 0.031, 0.075, 20, 1, true).translate(0, 0.075, 0);
            instanced(geoBody, new THREE.MeshMatcapMaterial({ matcap: mcSoft, map: T.canLabel(b) }), list);
            instanced(new THREE.CylinderGeometry(0.031, 0.029, 0.036, 20).translate(0, 0.019, 0), liquid, list);
            instanced(new THREE.CylinderGeometry(0.012, 0.031, 0.045, 20, 1, true).translate(0, 0.135, 0), liquid, list);
            instanced(new THREE.CylinderGeometry(0.012, 0.012, 0.014, 12).translate(0, 0.163, 0), liquid, list);
            instanced(new THREE.CylinderGeometry(0.0135, 0.0135, 0.014, 12).translate(0, 0.177, 0), new THREE.MeshMatcapMaterial({ matcap: mcSoft, color: b.cap }), list);
          }
        }
      } else {
        const cols = 5;
        for (let r = 0; r < rows; r++) {
          const sy = wy0 - wh / 2 + 0.02 + r * rowH;
          for (let c = 0; c < cols; c++) {
            if (rnd() < 0.05) continue;
            const x = wx0 - ww / 2 + (c + 0.5) * (ww / cols) + (rnd() - 0.5) * 0.014;
            const design = (r * 2 + c) % SNACKS.length;
            if (r === 0) put(`bar${design % 2}`, x, sy, 0.3 + (rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.05, -0.12);
            else put(`bag${design}`, x, sy, 0.29 + (rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.14, -0.1 - rnd() * 0.08, 0.94 + rnd() * 0.1);
          }
        }
        // 봉지: 가운데가 부풀고 위아래는 납작하게 붙은 꼴. 주름은 법선 그림으로 낸다.
        const bw = 0.105, bh = 0.155, bd = 0.03;
        const bagGeo = new THREE.PlaneGeometry(bw, bh, 12, 16);
        const pos = bagGeo.attributes.position;
        for (let k = 0; k < pos.count; k++) {
          const u = pos.getX(k) / (bw / 2);
          const v = pos.getY(k) / (bh / 2);
          const seal = Math.max(0, 1 - Math.abs(v) / 0.84); // 접힌 자리에서는 0
          const puff = Math.min(1, seal * 3) ** 0.7 * (1 - Math.abs(u) ** 3);
          pos.setZ(k, bd * puff + Math.sin(u * 9 + v * 5) * 0.0012 * seal);
          pos.setX(k, pos.getX(k) * (1 - 0.06 * puff)); // 부풀면서 폭이 조금 준다
        }
        bagGeo.computeVertexNormals();
        bagGeo.translate(0, bh / 2, 0);
        const barGeo = new THREE.BoxGeometry(0.1, 0.14, 0.028).translate(0, 0.07, 0);
        const mcBag = T.matcap(0.85);
        const wrinkle = T.crinkle();
        const d = new THREE.Object3D();
        for (const [key, list] of places) {
          const isBar = key.startsWith('bar');
          const dsg = isBar ? BARS[+key.slice(3)] : SNACKS[+key.slice(3)];
          const mat = new THREE.MeshMatcapMaterial({ matcap: mcBag, map: T.bagLabel(dsg), side: THREE.DoubleSide });
          if (!isBar) {
            mat.normalMap = wrinkle;
            mat.normalScale.set(0.9, 0.9);
          }
          const im = new THREE.InstancedMesh(isBar ? barGeo : bagGeo, mat, list.length);
          list.forEach(([x, y, z, ry, rz, rx, sc], k) => {
            d.position.set(x, y, z);
            d.rotation.set(rx, ry, rz);
            d.scale.setScalar(sc);
            d.updateMatrix();
            im.setMatrixAt(k, d.matrix);
          });
          g.add(im);
        }
      }
      // 유리: 어렴풋한 비침 위에 비스듬한 빛 줄기
      g.add(mesh(new THREE.PlaneGeometry(ww, wh), mGlass, wx0, wy0, 0.404));
      g.add(mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshBasicMaterial({ map: T.glassShine(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.38 }), wx0, wy0, 0.406));
      for (const [bw, bh, bx, by] of [[ww + 0.06, 0.03, wx0, wy0 + wh / 2 + 0.015], [ww + 0.06, 0.03, wx0, wy0 - wh / 2 - 0.015], [0.03, wh, wx0 - ww / 2 - 0.015, wy0], [0.03, wh, wx0 + ww / 2 + 0.015, wy0]]) g.add(box(bw, bh, 0.02, mTrim, bx, by, 0.405));
      // 오른쪽 기둥: 화면, 단추, 동전 구멍, 지폐 구멍
      const px = 0.36;
      g.add(box(0.2, 1.08, 0.02, mTrim, px, wy0, 0.405));
      // 화면(기다릴 때 뜨는 글)과 번호판(01 부터 차례로)
      g.add(box(0.17, 0.085, 0.012, mDark, px, 1.53, 0.415));
      const lcd = new THREE.MeshBasicMaterial({ map: T.lcd('SELECT ITEM') });
      lcd.color.setScalar(1.5);
      g.add(mesh(new THREE.PlaneGeometry(0.16, 0.07), lcd, px, 1.53, 0.4215));
      g.add(box(0.19, 0.19, 0.012, mDark, px, 1.37, 0.415));
      g.add(mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshBasicMaterial({ map: T.keypad() }), px, 1.37, 0.4215));
      g.add(box(0.1, 0.1, 0.012, mBrass, px, 1.12, 0.418), box(0.012, 0.06, 0.014, mDark, px, 1.12, 0.42)); // 동전
      g.add(box(0.14, 0.05, 0.012, mDark, px, 0.98, 0.418), box(0.12, 0.012, 0.014, lit(0.3, 0.8, 1.6), px, 0.98, 0.42)); // 지폐
      g.add(box(0.1, 0.07, 0.03, mDark, px, 0.72, 0.42)); // 거스름돈 나오는 곳
      // 아래 꺼내는 칸
      g.add(box(0.72, 0.26, 0.02, mTrim, -0.1, 0.32, 0.405));
      g.add(box(0.62, 0.17, 0.014, new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.25, metalness: 0.6 }), -0.1, 0.31, 0.418));
      g.add(box(0.3, 0.02, 0.02, mBrass, -0.1, 0.42, 0.425));
      g.scale.setScalar(VEND);
      g.position.set(wx - 0.42 * VEND, 0, z);
      g.rotation.y = -Math.PI / 2;
      scene.add(g);
      block(wx - 0.42 * VEND, z, 0.44 * VEND, 0.52 * VEND);
      shadow(wx - 0.75 * VEND, z, 1.2 * VEND, 1.3 * VEND, 0.6);
    };
    machine(2.1, 'DRINKS', '#8e1017', ['#d7262f', '#1f4fa8', '#2e9e55', '#f2c230', '#f2f0ea', '#e8842c'], 'cans');
    machine(3.55, 'SNACKS', '#173a63', ['#e8842c', '#f2c230', '#b8402f', '#7a4ea8', '#3aa0a8', '#d94f7a'], 'bags');
    // 쓰레기통
    scene.add(mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.72, 20), mBlack, wx - 0.45, 0.36, 4.65));
    scene.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 20), mBrass, wx - 0.45, 0.74, 4.65));
    scene.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 20), mDark, wx - 0.45, 0.762, 4.65));
    block(wx - 0.45, 4.65, 0.22, 0.22);
    shadow(wx - 0.45, 4.65, 0.8, 0.8, 0.6);
  }

  // ---------- 화장실 (왼쪽 벽, 문 쪽): 문 위 간판, 왼쪽 문 남자, 오른쪽 문 여자 ----------
  {
    const wx = -W / 2;
    const z = 3.5;
    scene.add(panel(1.5, 0.375, T.restroomSign(), wx + 0.075, 2.72, z, '+x', 0.95));
    scene.add(box(0.06, 0.44, 1.58, mBlack, wx + 0.035, 2.72, z));
    // 벽을 마주 보면 왼쪽이 +z 쪽이다
    // 두 문 사이는 0.9m 벽으로 띄운다
    for (const [dz, kind] of [[1.0, 'men'], [-1.0, 'women']]) {
      scene.add(box(0.08, 2.28, 1.12, mBlack, wx + 0.04, 1.14, z + dz));
      scene.add(box(0.05, 2.14, 0.98, mWood, wx + 0.09, 1.09, z + dz));
      scene.add(box(0.05, 0.04, 0.14, mBrass, wx + 0.14, 1.02, z + dz + (kind === 'men' ? -0.36 : 0.36)));
      scene.add(panel(0.3, 0.42, T.pictogram(kind), wx + 0.12, 1.62, z + dz, '+x', 0.9));
    }
    // 문 옆 쓰레기통
    scene.add(mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.72, 20), mBlack, wx + 0.45, 0.36, z + 1.95));
    scene.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 20), mBrass, wx + 0.45, 0.74, z + 1.95));
    block(wx + 0.45, z + 1.95, 0.22, 0.22);
    shadow(wx + 0.45, z + 1.95, 0.8, 0.8, 0.6);
  }

  // ---------- 나가는 문 (뒤쪽 벽) ----------
  {
    const z = D / 2 - 0.05;
    scene.add(box(3.3, 3.0, 0.1, mBlack, 0, 1.5, z));
    const leaf = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.08, metalness: 0.6 });
    scene.add(box(1.45, 2.7, 0.06, leaf, -0.76, 1.4, z - 0.06), box(1.45, 2.7, 0.06, leaf, 0.76, 1.4, z - 0.06));
    scene.add(box(0.04, 0.9, 0.05, mBrass, -0.14, 1.3, z - 0.12), box(0.04, 0.9, 0.05, mBrass, 0.14, 1.3, z - 0.12));
  }

  // ---------- 벽 램프: 갓, 번지는 빛, 벽에 퍼지는 빛 (전과 같은 수) ----------
  {
    const shadeGeo = new THREE.CylinderGeometry(0.085, 0.13, 0.3, 16, 1, true);
    const mShade = lit(3.4, 2.2, 1.0, { side: THREE.DoubleSide });
    const spriteMat = new THREE.SpriteMaterial({ map: tGlow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85 });
    const washMat = new THREE.MeshBasicMaterial({ map: tGlow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.36 });
    const sconce = (x, z, rotY, withLight) => {
      const g = new THREE.Group();
      g.position.set(x, 2.6, z);
      g.rotation.y = rotY;
      g.add(box(0.14, 0.36, 0.03, mBrass, 0, 0, 0.015));
      g.add(box(0.03, 0.03, 0.16, mBrass, 0, -0.08, 0.09));
      g.add(mesh(shadeGeo, mShade, 0, 0.04, 0.17));
      g.add(mesh(new THREE.PlaneGeometry(2.0, 3.2), washMat, 0, 0.1, 0.012));
      const s = new THREE.Sprite(spriteMat);
      s.position.set(0, 0.05, 0.2);
      s.scale.set(1.4, 1.4, 1);
      g.add(s);
      if (withLight) {
        const l = new THREE.PointLight(0xffb060, 8, 6, 2);
        l.position.set(0, 0.1, 0.45);
        g.add(l);
        extraLights.push(l);
      }
      scene.add(g);
    };
    sconce(-W / 2, 1.0, Math.PI / 2, true);
    sconce(-W / 2, 5.95, Math.PI / 2, false);
    sconce(W / 2, 0.6, -Math.PI / 2, true);
    sconce(W / 2, 5.5, -Math.PI / 2, false);
    for (const x of [-6.35, 6.35]) sconce(x, -D / 2, 0, false);
    for (const x of [-4.6, 4.6]) sconce(x, D / 2, Math.PI, true);
  }

  return {
    scene,
    posters,
    colliders,
    bounds: { minX: -W / 2 + 0.45, maxX: W / 2 - 0.45, minZ: -D / 2 + 0.75, maxZ: D / 2 - 0.5 },
    start: { x: 0, z: 5.5, yaw: 0 },
    reflector,
    extraLights,
    ceilingLights,
    hemi,
    setPoster,
    highlight,
  };
}
