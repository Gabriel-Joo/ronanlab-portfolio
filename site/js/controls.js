// 걷기와 둘러보기.
// 데스크톱: WASD 와 방향키로 걷고, 마우스를 누른 채 끌어 둘러본다.
// 휴대폰: 왼쪽 조이스틱으로 걷고, 오른쪽 조이스틱(또는 화면 끌기)으로 둘러본다.

const EYE = 1.65;
const RADIUS = 0.36;
const WALK = 3.3;
const RUN = 5.6;
const TURN = 2.0; // 조이스틱으로 도는 빠르기(라디안/초)
// 끌어서 둘러보는 방향(2026-11-20 사용자가 직접 써 보고 -1 로 정함).
// -1: 끄는 쪽으로 화면이 따라온다. 1: 그 반대. 주소 뒤에 ?look=flip 을 붙이면 그 자리에서 반대로 써 볼 수 있다.
const LOOK_DEFAULT = -1;
const LOOK = new URLSearchParams(location.search).get('look') === 'flip' ? -LOOK_DEFAULT : LOOK_DEFAULT;

const KEYMAP = {
  KeyW: 'f', ArrowUp: 'f',
  KeyS: 'b', ArrowDown: 'b',
  KeyA: 'l', ArrowLeft: 'l',
  KeyD: 'r', ArrowRight: 'r',
};

// 화면 조이스틱 하나. value 는 -1..1.
class Stick {
  constructor(el) {
    this.el = el;
    this.knob = el.querySelector('.stick-knob');
    this.value = { x: 0, y: 0 };
    this.id = null;
    el.addEventListener('pointerdown', (e) => {
      this.id = e.pointerId;
      el.setPointerCapture(e.pointerId);
      this.move(e);
      e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.id) this.move(e);
    });
    const end = (e) => {
      if (e.pointerId !== this.id) return;
      this.id = null;
      this.value.x = this.value.y = 0;
      this.knob.style.transform = '';
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  move(e) {
    const r = this.el.getBoundingClientRect();
    const max = r.width / 2;
    let dx = e.clientX - (r.left + max);
    let dy = e.clientY - (r.top + max);
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx *= max / len;
      dy *= max / len;
    }
    this.value.x = dx / max;
    this.value.y = dy / max;
    this.knob.style.transform = `translate(${dx * 0.6}px, ${dy * 0.6}px)`;
  }
}

export class Walker {
  constructor(camera, dom, { colliders, bounds, start, moveStick, lookStick, onTap, onPointer }) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.bounds = bounds;
    this.x = start.x;
    this.z = start.z;
    this.yaw = start.yaw;
    this.pitch = 0;
    this.keys = new Set();
    this.run = false;
    this.enabled = false;
    this.bob = 0;
    this.moveStick = moveStick ? new Stick(moveStick) : null;
    this.lookStick = lookStick ? new Stick(lookStick) : null;
    this.dragging = false;
    camera.rotation.order = 'YXZ';

    window.addEventListener('keydown', (e) => {
      if (!this.enabled || e.target.closest?.('input, textarea, dialog')) return;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.run = true;
      const k = KEYMAP[e.code];
      if (!k) return;
      this.keys.add(k);
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.run = false;
      const k = KEYMAP[e.code];
      if (k) this.keys.delete(k);
    });
    window.addEventListener('blur', () => this.stop());

    // 끌면 둘러보기, 거의 안 움직이고 떼면 누르기.
    let down = null;
    dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: 0 };
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', (e) => {
      onPointer?.(e);
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.lx;
      const dy = e.clientY - down.ly;
      down.lx = e.clientX;
      down.ly = e.clientY;
      down.moved += Math.abs(dx) + Math.abs(dy);
      if (down.moved > 6) {
        this.dragging = true;
        const k = e.pointerType === 'touch' ? 0.0042 : 0.0028;
        this.yaw -= dx * k * LOOK;
        this.pitch = Math.max(-1.1, Math.min(1.1, this.pitch - dy * k * LOOK));
      }
    });
    const up = (e) => {
      if (!down || e.pointerId !== down.id) return;
      const tap = down.moved <= 6;
      down = null;
      this.dragging = false;
      if (tap && e.type === 'pointerup') onTap?.(e);
    };
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', up);
    this.apply();
  }

  stop() {
    this.keys.clear();
    this.run = false;
  }

  blocked(x, z) {
    const b = this.bounds;
    if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return true;
    for (const c of this.colliders) {
      if (x > c.minX - RADIUS && x < c.maxX + RADIUS && z > c.minZ - RADIUS && z < c.maxZ + RADIUS) return true;
    }
    return false;
  }

  update(dt) {
    if (!this.enabled) return;
    let f = (this.keys.has('f') ? 1 : 0) - (this.keys.has('b') ? 1 : 0);
    let s = (this.keys.has('r') ? 1 : 0) - (this.keys.has('l') ? 1 : 0);
    if (this.moveStick) {
      f -= this.moveStick.value.y;
      s += this.moveStick.value.x;
    }
    if (this.lookStick) {
      const v = this.lookStick.value;
      this.yaw -= v.x * TURN * dt;
      this.pitch = Math.max(-1.1, Math.min(1.1, this.pitch - v.y * TURN * 0.7 * dt));
    }
    const len = Math.hypot(f, s);
    let moving = false;
    if (len > 0.05) {
      const scale = (this.run ? RUN : WALK) * Math.min(1, len) / len * dt;
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const dx = (-sin * f + cos * s) * scale;
      const dz = (-cos * f - sin * s) * scale;
      // 축마다 따로 막아서 벽을 타고 미끄러지게 한다
      if (!this.blocked(this.x + dx, this.z)) {
        this.x += dx;
        moving = true;
      }
      if (!this.blocked(this.x, this.z + dz)) {
        this.z += dz;
        moving = true;
      }
    }
    this.bob = moving ? this.bob + dt * (this.run ? 13 : 9) : this.bob * 0.9;
    this.apply(moving);
  }

  apply(moving = false) {
    const sway = moving ? Math.sin(this.bob) * 0.028 : Math.sin(this.bob) * 0.028 * 0.5;
    this.camera.position.set(this.x, EYE + sway, this.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
