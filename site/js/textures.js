// 그림 파일 없이 캔버스로 그려 쓰는 질감과 간판.
import * as THREE from 'three';

const DISPLAY = 'Anton, Impact, "Arial Narrow Bold", "Noto Sans KR", sans-serif';
const SANS = '"Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

// 같은 무늬가 매번 나오도록 씨앗 있는 난수.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function speckle(g, w, h, n, seed, colors, size = 1.6) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(r() * colors.length) | 0];
    g.globalAlpha = 0.25 + r() * 0.5;
    g.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r()));
  }
  g.globalAlpha = 1;
}

// 빨간 카펫: 짙은 붉은 바탕에 옅은 마름모 무늬와 보풀.
export function carpet(repeat) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#5e0f15';
  g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, 26000, 7, ['#7a1820', '#4a0a10', '#681219', '#3c080d'], 2);
  g.strokeStyle = 'rgba(205, 150, 70, 0.20)';
  g.lineWidth = 3;
  for (let y = -1; y < 3; y++) {
    for (let x = -1; x < 3; x++) {
      const cx = x * 256 + (y % 2 ? 128 : 0) + 128;
      const cy = y * 256 + 128;
      g.beginPath();
      g.moveTo(cx, cy - 92);
      g.lineTo(cx + 92, cy);
      g.lineTo(cx, cy + 92);
      g.lineTo(cx - 92, cy);
      g.closePath();
      g.stroke();
      g.fillStyle = 'rgba(205, 150, 70, 0.16)';
      g.beginPath();
      g.arc(cx, cy, 12, 0, Math.PI * 2);
      g.fill();
    }
  }
  speckle(g, 512, 512, 9000, 11, ['#2e0609', '#8a2028'], 1.4);
  return tex(c, { repeat });
}

export function carpetBump(repeat) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 256, 256);
  speckle(g, 256, 256, 30000, 3, ['#ffffff', '#000000', '#b0b0b0', '#505050'], 1.5);
  return tex(c, { repeat, srgb: false });
}

// 위쪽 벽: 어두운 자줏빛 천 패널.
export function wallFabric(repeat) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#2a1a20';
  g.fillRect(0, 0, 512, 512);
  speckle(g, 512, 512, 22000, 21, ['#33212a', '#211419', '#3a2630'], 2);
  for (let x = 0; x <= 512; x += 256) {
    const grad = g.createLinearGradient(x - 10, 0, x + 10, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(x - 10, 0, 20, 512);
  }
  return tex(c, { repeat });
}

// 아래쪽 벽과 가구: 짙은 호두나무.
export function wood(repeat) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#2b1710';
  g.fillRect(0, 0, 512, 512);
  const r = rng(5);
  for (let i = 0; i < 260; i++) {
    const y = r() * 512;
    g.strokeStyle = r() > 0.5 ? 'rgba(70,38,22,0.5)' : 'rgba(14,7,4,0.5)';
    g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(170, y + (r() - 0.5) * 14, 340, y + (r() - 0.5) * 14, 512, y + (r() - 0.5) * 8);
    g.stroke();
  }
  return tex(c, { repeat });
}

// 포스터가 아직 없는 액자 안: 빈 칸에 어느 프로젝트 자리인지만 적는다.
export function posterPlaceholder(title, index) {
  const [c, g] = canvas(512, 768);
  const grad = g.createLinearGradient(0, 0, 0, 768);
  grad.addColorStop(0, '#17131a');
  grad.addColorStop(1, '#0c0a0d');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 768);
  g.strokeStyle = 'rgba(214, 170, 96, 0.45)';
  g.lineWidth = 2;
  g.setLineDash([10, 9]);
  g.strokeRect(28, 28, 456, 712);
  g.setLineDash([]);
  g.textAlign = 'center';
  g.fillStyle = 'rgba(214, 170, 96, 0.55)';
  g.font = `28px ${DISPLAY}`;
  g.fillText(`POSTER 0${index + 1}`, 256, 330);
  g.fillStyle = '#efe6d6';
  let size = 64;
  g.font = `${size}px ${DISPLAY}`;
  while (g.measureText(title).width > 400 && size > 24) {
    size -= 2;
    g.font = `${size}px ${DISPLAY}`;
  }
  g.fillText(title, 256, 410);
  g.fillStyle = 'rgba(239, 230, 214, 0.45)';
  g.font = `600 24px ${SANS}`;
  g.fillText('포스터 자리', 256, 462);
  return tex(c);
}

// 액자 아래 놋쇠 이름판.
export function plaque(title) {
  const [c, g] = canvas(512, 96);
  const grad = g.createLinearGradient(0, 0, 0, 96);
  grad.addColorStop(0, '#caa45c');
  grad.addColorStop(0.5, '#8f6c2f');
  grad.addColorStop(1, '#b08a45');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 96);
  g.strokeStyle = 'rgba(40, 24, 6, 0.7)';
  g.lineWidth = 3;
  g.strokeRect(7, 7, 498, 82);
  g.fillStyle = '#20140a';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 50;
  g.font = `${size}px ${DISPLAY}`;
  while (g.measureText(title).width > 450 && size > 20) {
    size -= 2;
    g.font = `${size}px ${DISPLAY}`;
  }
  g.fillText(title, 256, 51);
  return tex(c);
}

// 네온 글자: 검은 바탕 위 빛나는 관. 더하기 섞기로 올려 검은 곳은 보이지 않는다.
export function neon(text, { color = '#ff2d55', w = 1024, h = 256 } = {}) {
  const [c, g] = canvas(w, h);
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = h * 0.62;
  g.font = `${size}px ${DISPLAY}`;
  while (g.measureText(text).width > w * 0.9) {
    size -= 4;
    g.font = `${size}px ${DISPLAY}`;
  }
  g.lineJoin = 'round';
  g.shadowColor = color;
  for (const blur of [60, 34, 16]) {
    g.shadowBlur = blur;
    g.strokeStyle = color;
    g.lineWidth = 9;
    g.strokeText(text, w / 2, h / 2 + 4);
  }
  g.shadowBlur = 0;
  g.strokeStyle = '#fff2f4';
  g.lineWidth = 3.5;
  g.strokeText(text, w / 2, h / 2 + 4);
  return tex(c);
}

// 입간판: 전구 테두리, NOW SHOWING, 프로젝트 이름 넷.
export function standee(heading, titles, footer) {
  const [c, g] = canvas(512, 1024);
  const grad = g.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#1a0c10');
  grad.addColorStop(1, '#0d0709');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 1024);
  g.strokeStyle = '#c9a05a';
  g.lineWidth = 4;
  g.strokeRect(30, 30, 452, 964);
  // 전구
  g.shadowColor = '#ffd27a';
  g.shadowBlur = 14;
  g.fillStyle = '#fff1c4';
  const bulbs = [];
  for (let x = 30; x <= 482; x += 37.67) bulbs.push([x, 30], [x, 994]);
  for (let y = 67; y < 994; y += 37.07) bulbs.push([30, y], [482, y]);
  for (const [x, y] of bulbs) {
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fill();
  }
  g.shadowBlur = 0;
  g.textAlign = 'center';
  g.fillStyle = '#ffcf6b';
  g.font = `84px ${DISPLAY}`;
  const words = heading.split(' ');
  g.fillText(words[0] || '', 256, 180);
  g.fillText(words.slice(1).join(' '), 256, 268);
  g.fillStyle = '#c9a05a';
  g.fillRect(96, 310, 320, 3);
  titles.forEach((t, i) => {
    const y = 420 + i * 128;
    g.fillStyle = 'rgba(201, 160, 90, 0.9)';
    g.font = `30px ${DISPLAY}`;
    g.fillText(`0${i + 1}`, 256, y - 44);
    g.fillStyle = '#f4ecdf';
    let size = 60;
    g.font = `${size}px ${DISPLAY}`;
    while (g.measureText(t).width > 380 && size > 24) {
      size -= 2;
      g.font = `${size}px ${DISPLAY}`;
    }
    g.fillText(t, 256, y + 12);
  });
  g.fillStyle = 'rgba(201, 160, 90, 0.85)';
  g.font = `28px ${DISPLAY}`;
  g.fillText(footer, 256, 950);
  return tex(c);
}

// 작은 간판(팝콘 기계, 매표소 창구 머리).
export function label(text, { fg = '#fff3d0', bg = '#8e1017', w = 512, h = 128 } = {}) {
  const [c, g] = canvas(w, h);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255, 220, 150, 0.8)';
  g.lineWidth = 5;
  g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = h * 0.6;
  g.font = `${size}px ${DISPLAY}`;
  while (g.measureText(text).width > w * 0.84) {
    size -= 3;
    g.font = `${size}px ${DISPLAY}`;
  }
  g.fillText(text, w / 2, h / 2 + 4);
  return tex(c);
}

// 램프 둘레에 번지는 빛.
export function glow(color = '255, 190, 110') {
  const [c, g] = canvas(256, 256);
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${color}, 1)`);
  grad.addColorStop(0.18, `rgba(${color}, 0.55)`);
  grad.addColorStop(0.45, `rgba(${color}, 0.16)`);
  grad.addColorStop(1, `rgba(${color}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return tex(c);
}

// 물건 밑에 깔리는 그림자 얼룩.
export function blob() {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return tex(c);
}

// 액자 조명이 내리는 빛줄기.
export function beam() {
  const [c, g] = canvas(64, 256);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255, 226, 170, 0.55)');
  grad.addColorStop(0.5, 'rgba(255, 226, 170, 0.14)');
  grad.addColorStop(1, 'rgba(255, 226, 170, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 256);
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.5, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = side;
  g.fillRect(0, 0, 64, 256);
  return tex(c);
}

// 길을 내는 깔개: 짙은 자줏빛 바탕, 양옆 금색 줄, 가운데 무늬.
export function rug(repeatY) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#2c070c';
  g.fillRect(0, 0, 256, 256);
  speckle(g, 256, 256, 9000, 31, ['#3a0a11', '#220508', '#44101a'], 2);
  g.fillStyle = '#b98a3e';
  for (const x of [10, 22, 230, 242]) g.fillRect(x, 0, 4, 256);
  g.strokeStyle = 'rgba(185, 138, 62, 0.55)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(128, 30);
  g.lineTo(190, 128);
  g.lineTo(128, 226);
  g.lineTo(66, 128);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.arc(128, 128, 16, 0, Math.PI * 2);
  g.stroke();
  return tex(c, { repeat: [1, repeatY] });
}

// 팝콘 통의 빨강 하양 줄무늬.
export function stripes() {
  const [c, g] = canvas(128, 64);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#f4efe6' : '#b3151d';
    g.fillRect(i * 16, 0, 16, 64);
  }
  return tex(c);
}

// 자판기 앞면: 불 켜진 진열 칸과 아래 꺼내는 곳.
export function vending(title, body, cans) {
  const [c, g] = canvas(256, 512);
  g.fillStyle = body;
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#fff6dc';
  g.textAlign = 'center';
  g.font = `40px ${DISPLAY}`;
  g.fillText(title, 128, 50);
  g.fillStyle = '#f7f1e2';
  g.fillRect(22, 70, 162, 300);
  const r = rng(title.length * 7 + 3);
  for (let row = 0; row < 5; row++) {
    g.fillStyle = '#c9c2b2';
    g.fillRect(22, 126 + row * 60, 162, 5);
    for (let col = 0; col < 5; col++) {
      g.fillStyle = cans[(r() * cans.length) | 0];
      g.fillRect(32 + col * 30, 82 + row * 60, 20, 42);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(32 + col * 30, 96 + row * 60, 20, 8);
    }
  }
  g.fillStyle = '#16181c';
  g.fillRect(196, 80, 42, 150);
  g.fillStyle = '#6fe08c';
  g.fillRect(202, 90, 30, 16);
  g.fillStyle = '#3a3d44';
  for (let i = 0; i < 6; i++) g.fillRect(202 + (i % 2) * 16, 116 + ((i / 2) | 0) * 18, 12, 12);
  g.fillStyle = '#0c0d10';
  g.fillRect(22, 400, 162, 70);
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 3;
  g.strokeRect(22, 400, 162, 70);
  return tex(c);
}

// 화장실 표지판: 사람 그림 둘과 글자.
export function restroom() {
  const [c, g] = canvas(384, 192);
  g.fillStyle = '#16304f';
  g.fillRect(0, 0, 384, 192);
  g.strokeStyle = '#e9eef5';
  g.lineWidth = 6;
  g.strokeRect(8, 8, 368, 176);
  g.fillStyle = '#e9eef5';
  const person = (x, skirt) => {
    g.beginPath();
    g.arc(x, 48, 15, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    if (skirt) {
      g.moveTo(x - 12, 70);
      g.lineTo(x + 12, 70);
      g.lineTo(x + 30, 128);
      g.lineTo(x - 30, 128);
    } else {
      g.rect(x - 19, 70, 38, 58);
    }
    g.fill();
    g.fillRect(x - 15, 128, 11, 34);
    g.fillRect(x + 4, 128, 11, 34);
  };
  person(70, false);
  person(150, true);
  g.fillRect(109, 30, 4, 134);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  fitText(g, 'RESTROOM', 176, 52, DISPLAY);
  g.fillText('RESTROOM', 284, 100);
  return tex(c);
}

// 안내판과 매점 차림판: 머리글과 줄 몇 개.
export function board(heading, lines, { bg = '#101418', fg = '#f1e9dc', accent = '#d6aa60', w = 384, h = 512 } = {}) {
  const [c, g] = canvas(w, h);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = accent;
  g.lineWidth = 5;
  g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = accent;
  g.textAlign = 'center';
  let size = 64;
  g.font = `${size}px ${DISPLAY}`;
  while (g.measureText(heading).width > w - 70) {
    size -= 3;
    g.font = `${size}px ${DISPLAY}`;
  }
  g.fillText(heading, w / 2, 84);
  g.fillRect(40, 108, w - 80, 4);
  const step = Math.min(84, (h - 150) / lines.length);
  lines.forEach(([left, right], i) => {
    const y = 150 + step * (i + 0.62);
    g.font = `800 ${Math.min(40, step * 0.52)}px ${SANS}`;
    g.fillStyle = fg;
    g.textAlign = 'left';
    g.fillText(left, 44, y);
    if (right) {
      g.fillStyle = accent;
      g.textAlign = 'right';
      g.fillText(right, w - 44, y);
    }
  });
  return tex(c);
}

// ---------- 자판기 안의 물건 ----------
// 이름은 모두 지어낸 것이다. 실제 상표는 쓰지 않는다.

// 빛이 위에서 떨어지는 느낌을 조명 없이 내는 공 그림(matcap). shiny 가 크면 금속 캔, 작으면 비닐 봉지.
export function matcap(shiny = 1) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#000';
  g.fillRect(0, 0, 256, 256);
  const base = g.createLinearGradient(0, 10, 0, 246);
  base.addColorStop(0, '#ffffff');
  base.addColorStop(0.3, '#cfcfcf');
  base.addColorStop(0.62, '#7c7c7c');
  base.addColorStop(1, '#262626');
  g.fillStyle = base;
  g.beginPath();
  g.arc(128, 128, 126, 0, Math.PI * 2);
  g.fill();
  // 옆이 어두워지는 둥근 맛
  const rim = g.createRadialGradient(128, 110, 40, 128, 128, 128);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(0.75, 'rgba(0,0,0,0.12)');
  rim.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = rim;
  g.fillRect(0, 0, 256, 256);
  // 반짝임: 세로로 선 밝은 띠와 위쪽 점
  const band = g.createLinearGradient(70, 0, 118, 0);
  band.addColorStop(0, 'rgba(255,255,255,0)');
  band.addColorStop(0.5, `rgba(255,255,255,${0.55 * shiny})`);
  band.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = band;
  g.fillRect(70, 20, 48, 210);
  const spot = g.createRadialGradient(100, 62, 0, 100, 62, 46);
  spot.addColorStop(0, `rgba(255,255,255,${0.9 * shiny})`);
  spot.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = spot;
  g.fillRect(40, 10, 130, 120);
  return tex(c);
}

function fitText(g, text, maxW, size, font) {
  g.font = `${size}px ${font}`;
  while (g.measureText(text).width > maxW && size > 8) {
    size -= 1;
    g.font = `${size}px ${font}`;
  }
  return size;
}

function motif(g, kind, x, y, r, color) {
  g.fillStyle = color;
  g.strokeStyle = color;
  if (kind === 'fruit') {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.beginPath();
    g.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2f7d3a';
    g.beginPath();
    g.ellipse(x + r * 0.5, y - r * 0.95, r * 0.45, r * 0.2, -0.6, 0, Math.PI * 2);
    g.fill();
  } else if (kind === 'bubbles') {
    for (const [dx, dy, k] of [[0, 0, 1], [-0.9, 0.5, 0.5], [0.8, -0.6, 0.6], [0.7, 0.8, 0.35], [-0.6, -0.8, 0.3]]) {
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x + dx * r, y + dy * r, r * 0.55 * k, 0, Math.PI * 2);
      g.stroke();
    }
  } else if (kind === 'wave') {
    g.lineWidth = 4;
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      for (let t = -1; t <= 1.01; t += 0.1) g.lineTo(x + t * r * 1.4, y + k * r * 0.5 + Math.sin(t * 6) * r * 0.2);
      g.stroke();
    }
  } else if (kind === 'chips') {
    for (const [dx, dy, a] of [[-0.5, 0.1, 0.3], [0.45, -0.2, -0.5], [0, 0.55, 1.2]]) {
      g.save();
      g.translate(x + dx * r, y + dy * r);
      g.rotate(a);
      g.beginPath();
      g.ellipse(0, 0, r * 0.62, r * 0.4, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.lineWidth = 1.5;
      for (let k = -2; k <= 2; k++) {
        g.beginPath();
        g.moveTo(k * r * 0.2, -r * 0.3);
        g.lineTo(k * r * 0.2, r * 0.3);
        g.stroke();
      }
      g.restore();
    }
  } else if (kind === 'ring') {
    g.lineWidth = r * 0.42;
    g.beginPath();
    g.arc(x, y, r * 0.7, 0, Math.PI * 2);
    g.stroke();
  } else if (kind === 'star') {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  } else if (kind === 'bean') {
    for (const [dx, dy, a] of [[-0.4, 0, 0.5], [0.45, 0.15, -0.4]]) {
      g.save();
      g.translate(x + dx * r, y + dy * r);
      g.rotate(a);
      g.beginPath();
      g.ellipse(0, 0, r * 0.38, r * 0.6, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.4)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, -r * 0.5);
      g.quadraticCurveTo(r * 0.15, 0, 0, r * 0.5);
      g.stroke();
      g.restore();
    }
  }
}

// 캔 둘레를 감는 그림: 위아래 띠 무늬, 이름과 그림이 앞뒤로 두 번.
export function canLabel({ name, sub, bg, ink, accent, pic }) {
  const [c, g] = canvas(256, 128);
  const body = g.createLinearGradient(0, 0, 0, 128);
  body.addColorStop(0, bg);
  body.addColorStop(1, accent);
  g.fillStyle = body;
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#d9dde2';
  g.fillRect(0, 0, 256, 7);
  g.fillRect(0, 121, 256, 7);
  g.fillStyle = ink;
  g.fillRect(0, 10, 256, 3);
  g.fillRect(0, 115, 256, 3);
  g.fillStyle = 'rgba(255,255,255,0.22)';
  g.fillRect(0, 16, 256, 2);
  g.fillRect(0, 110, 256, 2);
  for (const cx of [64, 192]) {
    motif(g, pic, cx, 46, 15, ink);
    g.fillStyle = ink;
    g.textAlign = 'center';
    fitText(g, name, 112, 26, DISPLAY);
    g.fillText(name, cx, 88);
    g.font = `700 9px ${SANS}`;
    g.fillText(sub, cx, 102);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.fillRect(cx - 62, 20, 2, 88);
  }
  return tex(c);
}

// 과자 봉지 앞면: 위아래 접어 붙인 자리, 이름과 그림, 비스듬히 비치는 빛.
export function bagLabel({ name, sub, bg, ink, accent, pic }) {
  const [c, g] = canvas(128, 192);
  const body = g.createLinearGradient(0, 0, 128, 192);
  body.addColorStop(0, bg);
  body.addColorStop(1, accent);
  g.fillStyle = body;
  g.fillRect(0, 0, 128, 192);
  g.fillStyle = 'rgba(255,255,255,0.14)';
  g.beginPath();
  g.ellipse(64, 120, 46, 40, 0, 0, Math.PI * 2);
  g.fill();
  motif(g, pic, 64, 122, 24, ink);
  g.fillStyle = ink;
  g.textAlign = 'center';
  const words = name.split(' ');
  fitText(g, words[0], 108, 30, DISPLAY);
  g.fillText(words[0], 64, 52);
  if (words[1]) {
    fitText(g, words.slice(1).join(' '), 108, 24, DISPLAY);
    g.fillText(words.slice(1).join(' '), 64, 78);
  }
  g.font = `700 9px ${SANS}`;
  g.fillText(sub, 64, 164);
  // 비치는 빛
  const shine = g.createLinearGradient(10, 0, 70, 60);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0.38)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = shine;
  g.fillRect(0, 0, 128, 192);
  // 위아래 접힌 자리: 밝은 띠에 촘촘한 세로 금
  for (const y of [0, 176]) {
    g.fillStyle = 'rgba(235,238,242,0.9)';
    g.fillRect(0, y, 128, 16);
    g.strokeStyle = 'rgba(0,0,0,0.28)';
    g.lineWidth = 1;
    for (let x = 2; x < 128; x += 4) {
      g.beginPath();
      g.moveTo(x, y + 2);
      g.lineTo(x, y + 14);
      g.stroke();
    }
  }
  return tex(c);
}

// 봉지의 구겨진 주름(법선 그림).
export function crinkle() {
  const N = 128;
  const h = new Float32Array(N * N);
  const r = rng(77);
  for (let k = 0; k < 16; k++) {
    const a = r() * Math.PI;
    const f = 0.05 + r() * 0.16;
    const ph = r() * 6.28;
    const amp = 0.4 + r() * 0.7;
    const cx = Math.cos(a), sy = Math.sin(a);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) h[y * N + x] += Math.abs(Math.sin((x * cx + y * sy) * f + ph)) ** 6 * amp;
  }
  const [c, g] = canvas(N, N);
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x + N - 1) % N)];
      const dy = h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x];
      const len = Math.hypot(dx, dy, 1.6);
      const i = (y * N + x) * 4;
      img.data[i] = (-dx / len * 0.5 + 0.5) * 255;
      img.data[i + 1] = (-dy / len * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1.6 / len * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return tex(c, { srgb: false, repeat: [1, 1] });
}

// 자판기 안쪽 벽: 어둡고, 줄마다 위에서 빛이 떨어진다.
export function shelfBack(rows) {
  const [c, g] = canvas(128, 512);
  g.fillStyle = '#0b0c10';
  g.fillRect(0, 0, 128, 512);
  const rh = 512 / rows;
  for (let i = 0; i < rows; i++) {
    const grad = g.createLinearGradient(0, i * rh, 0, (i + 1) * rh);
    grad.addColorStop(0, 'rgba(255, 244, 214, 0.62)');
    grad.addColorStop(0.35, 'rgba(255, 236, 200, 0.16)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = grad;
    g.fillRect(0, i * rh, 128, rh);
  }
  return tex(c);
}

// 유리창에 비치는 빛: 비스듬한 흰 줄 몇 가닥(더하기 섞기로 올린다).
export function glassShine() {
  const [c, g] = canvas(256, 512);
  g.fillStyle = '#000';
  g.fillRect(0, 0, 256, 512);
  g.save();
  g.translate(128, 256);
  g.rotate(-0.42);
  for (const [x, w, a] of [[-150, 46, 0.28], [-78, 12, 0.2], [60, 70, 0.16], [150, 9, 0.22]]) {
    const grad = g.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, `rgba(255,255,255,${a})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(x, -500, w, 1000);
  }
  g.restore();
  const fade = g.createLinearGradient(0, 0, 0, 512);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,0.75)');
  g.fillStyle = fade;
  g.fillRect(0, 0, 256, 512);
  return tex(c);
}

// 매점 차림표: 갈래마다 품목 이름과 값.
export function menu(title, sections, note) {
  const [c, g] = canvas(1024, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#1d0e10');
  grad.addColorStop(1, '#120809');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = '#d6aa60';
  g.lineWidth = 5;
  g.strokeRect(10, 10, 1004, 492);
  g.fillStyle = '#ffcf6b';
  g.textAlign = 'center';
  g.font = `58px ${DISPLAY}`;
  g.fillText(title, 512, 72);
  g.fillStyle = '#d6aa60';
  g.fillRect(60, 90, 904, 3);
  const colW = 452;
  sections.forEach((col, ci) => {
    let y = 132;
    const x0 = 60 + ci * (colW + 0);
    for (const [head, items] of col) {
      g.textAlign = 'left';
      g.fillStyle = '#e0604f';
      g.font = `30px ${DISPLAY}`;
      g.fillText(head, x0, y);
      y += 34;
      for (const [name, price] of items) {
        g.font = `700 25px ${SANS}`;
        g.fillStyle = '#f4ecdf';
        g.textAlign = 'left';
        g.fillText(name, x0, y);
        const nw = g.measureText(name).width;
        g.fillStyle = '#ffcf6b';
        g.textAlign = 'right';
        g.font = `800 25px ${SANS}`;
        g.fillText(price, x0 + colW - 40, y);
        const pw = g.measureText(price).width;
        g.strokeStyle = 'rgba(214,170,96,0.45)';
        g.lineWidth = 2;
        g.setLineDash([2, 7]);
        g.beginPath();
        g.moveTo(x0 + nw + 10, y - 6);
        g.lineTo(x0 + colW - 40 - pw - 10, y - 6);
        g.stroke();
        g.setLineDash([]);
        y += 35;
      }
      y += 16;
    }
  });
  if (note) {
    g.fillStyle = 'rgba(244,236,223,0.6)';
    g.textAlign = 'center';
    g.font = `600 19px ${SANS}`;
    g.fillText(note, 512, 484);
  }
  return tex(c);
}

// ---------- 자판기 번호판과 화면 ----------
export function keypad() {
  // 선반 다섯 줄, 한 줄 다섯 칸: 01 부터 25 까지
  const [c, g] = canvas(320, 320);
  g.fillStyle = '#101216';
  g.fillRect(0, 0, 320, 320);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let r = 0; r < 5; r++) {
    for (let col = 0; col < 5; col++) {
      const x = 7 + col * 62;
      const y = 7 + r * 62;
      const grad = g.createLinearGradient(0, y, 0, y + 54);
      grad.addColorStop(0, '#c9ccd2');
      grad.addColorStop(1, '#7d828c');
      g.fillStyle = grad;
      g.fillRect(x, y, 54, 54);
      g.strokeStyle = '#2a2d33';
      g.lineWidth = 3;
      g.strokeRect(x + 1.5, y + 1.5, 51, 51);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(x + 4, y + 4, 46, 3);
      g.fillStyle = '#15171b';
      g.font = `30px ${DISPLAY}`;
      g.fillText(String(r * 5 + col + 1).padStart(2, '0'), x + 27, y + 30);
    }
  }
  return tex(c);
}

export function lcd(text) {
  const [c, g] = canvas(256, 112);
  g.fillStyle = '#062412';
  g.fillRect(0, 0, 256, 112);
  g.fillStyle = 'rgba(120,255,160,0.08)';
  for (let y = 0; y < 112; y += 4) g.fillRect(0, y, 256, 1);
  g.fillStyle = '#7dffa6';
  g.shadowColor = '#3dff8a';
  g.shadowBlur = 10;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 30px "IBM Plex Mono", "DejaVu Sans Mono", Consolas, monospace';
  const words = text.split(' ');
  g.fillText(words[0], 128, 40);
  g.fillText(words.slice(1).join(' '), 128, 78);
  return tex(c);
}

// ---------- 매점 진열대 ----------
// 팝콘 통: 빨강 하양 줄무늬에 가운데 띠.
export function tub() {
  const [c, g] = canvas(256, 128);
  for (let i = 0; i < 16; i++) {
    g.fillStyle = i % 2 ? '#f6f1e7' : '#b8141c';
    g.fillRect(i * 16, 0, 16, 128);
  }
  g.fillStyle = '#f2c230';
  g.fillRect(0, 44, 256, 40);
  g.fillStyle = '#7a0c12';
  g.fillRect(0, 44, 256, 3);
  g.fillRect(0, 81, 256, 3);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `30px ${DISPLAY}`;
  for (const x of [64, 192]) g.fillText('POPCORN', x, 66);
  return tex(c);
}

// 음료 컵: 바탕색, 물결 띠, 지어낸 이름.
export function cup(bg, ink, text) {
  const [c, g] = canvas(256, 128);
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = ink;
  g.lineWidth = 7;
  for (const y0 of [26, 104]) {
    g.beginPath();
    for (let x = 0; x <= 256; x += 8) g.lineTo(x, y0 + Math.sin(x / 20.4) * 6);
    g.stroke();
  }
  g.fillStyle = ink;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const x of [64, 192]) {
    fitText(g, text, 110, 34, DISPLAY);
    g.fillText(text, x, 66);
  }
  return tex(c);
}

// 종이 받침의 빨강 하양 바둑무늬.
export function checker() {
  const [c, g] = canvas(64, 64);
  g.fillStyle = '#f6f1e7';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#c4202d';
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2) g.fillRect(x * 16, y * 16, 16, 16);
  return tex(c, { repeat: [3, 2] });
}

// 음식 앞에 세우는 작은 이름표: 품목과 값.
export function priceCard(name, price) {
  const [c, g] = canvas(256, 128);
  g.fillStyle = '#fbf6ea';
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#b8141c';
  g.lineWidth = 6;
  g.strokeRect(5, 5, 246, 118);
  g.textAlign = 'center';
  g.fillStyle = '#1b1210';
  let size = 36;
  g.font = `800 ${size}px ${SANS}`;
  while (g.measureText(name).width > 226 && size > 14) {
    size -= 2;
    g.font = `800 ${size}px ${SANS}`;
  }
  g.fillText(name, 128, 54);
  g.fillStyle = '#b8141c';
  g.font = `44px ${DISPLAY}`;
  g.fillText(price, 128, 106);
  return tex(c);
}

// 화장실: 문 위 간판과 문에 붙는 남녀 표시.
export function restroomSign() {
  const [c, g] = canvas(512, 128);
  g.fillStyle = '#16304f';
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#e9eef5';
  g.lineWidth = 6;
  g.strokeRect(8, 8, 496, 112);
  g.fillStyle = '#e9eef5';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `76px ${DISPLAY}`;
  g.fillText('RESTROOM', 256, 68);
  return tex(c);
}

export function pictogram(kind) {
  const [c, g] = canvas(160, 224);
  g.fillStyle = kind === 'women' ? '#c2457e' : '#16304f'; // 남자는 남색, 여자는 분홍
  g.fillRect(0, 0, 160, 224);
  g.strokeStyle = '#e9eef5';
  g.lineWidth = 6;
  g.strokeRect(7, 7, 146, 210);
  g.fillStyle = '#e9eef5';
  const x = 80;
  g.beginPath();
  g.arc(x, 52, 22, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  if (kind === 'women') {
    g.moveTo(x - 17, 84);
    g.lineTo(x + 17, 84);
    g.lineTo(x + 44, 160);
    g.lineTo(x - 44, 160);
  } else {
    g.rect(x - 28, 84, 56, 78);
  }
  g.fill();
  g.fillRect(x - 22, 160, 16, 44);
  g.fillRect(x + 6, 160, 16, 44);
  if (kind === 'men') {
    g.fillRect(x - 44, 86, 12, 62);
    g.fillRect(x + 32, 86, 12, 62);
  }
  return tex(c);
}
