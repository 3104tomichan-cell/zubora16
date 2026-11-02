// スタート画面の背景で、イラストが左上から右下へゆっくり落ちてくる演出。
// 指でつまんで動かせる。離すと、触られなかった場合にいたはずの位置（落下の軌道上）へバネのように戻る。

const COUNT_MAX = 9;
const SPEED = [22, 40]; // px/秒
const SIZE = [64, 96]; // px
const STIFFNESS = 90; // バネの強さ
const DAMPING = 16; // 減衰（大きいほど揺れずに戻る）

const rand = (a, b) => a + Math.random() * (b - a);

export function createFall(layer, sources) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [];
  let running = false;
  let last = 0;
  let raf = 0;
  let placed = false; // 画面が表示されてから散らばらせる（非表示中は大きさが0のため）

  function size() {
    return { w: layer.clientWidth, h: layer.clientHeight };
  }

  // 画面の上辺か左辺の外側から出発させる
  function respawn(it, first) {
    const { w, h } = size();
    const s = it.size;
    if (first) {
      it.hx = rand(-s, w);
      it.hy = rand(-s, h);
    } else if (Math.random() < w / (w + h)) {
      it.hx = rand(-s, w * 0.8);
      it.hy = -s - rand(0, h * 0.3);
    } else {
      it.hx = -s - rand(0, w * 0.3);
      it.hy = rand(-s, h * 0.6);
    }
    const angle = rand(35, 55) * (Math.PI / 180); // 右下向き
    const speed = rand(...SPEED);
    it.vx = Math.cos(angle) * speed;
    it.vy = Math.sin(angle) * speed;
    it.spin = rand(-12, 12); // 度/秒
    it.x = it.hx;
    it.y = it.hy;
    it.dx = 0; // バネの速度
    it.dy = 0;
    it.mode = 'fall';
  }

  function make(src) {
    const el = document.createElement('img');
    el.className = 'fall-item';
    el.src = src;
    el.alt = '';
    el.draggable = false;
    const it = { el, size: rand(...SIZE), rot: rand(-20, 20), mode: 'fall', pointer: null };
    el.style.width = `${it.size}px`;
    el.addEventListener('pointerdown', (e) => grab(it, e));
    el.addEventListener('pointermove', (e) => drag(it, e));
    el.addEventListener('pointerup', (e) => release(it, e));
    el.addEventListener('pointercancel', (e) => release(it, e));
    layer.append(el);
    items.push(it);
  }

  function grab(it, e) {
    e.preventDefault();
    it.el.setPointerCapture(e.pointerId);
    it.pointer = e.pointerId;
    it.mode = 'drag';
    it.offX = e.clientX - it.x;
    it.offY = e.clientY - it.y;
    it.el.classList.add('is-held');
  }

  function drag(it, e) {
    if (it.pointer !== e.pointerId) return;
    it.x = e.clientX - it.offX;
    it.y = e.clientY - it.offY;
  }

  function release(it, e) {
    if (it.pointer !== e.pointerId) return;
    it.pointer = null;
    it.mode = 'return';
    it.dx = 0;
    it.dy = 0;
    it.el.classList.remove('is-held');
  }

  function step(dt) {
    const { w, h } = size();
    for (const it of items) {
      // あるべき位置（軌道上の位置）は、触られている間も進み続ける
      if (!reduced) {
        it.hx += it.vx * dt;
        it.hy += it.vy * dt;
        it.rot += it.spin * dt;
      }
      if (it.mode === 'fall') {
        it.x = it.hx;
        it.y = it.hy;
      } else if (it.mode === 'return') {
        const ax = STIFFNESS * (it.hx - it.x) - DAMPING * it.dx;
        const ay = STIFFNESS * (it.hy - it.y) - DAMPING * it.dy;
        it.dx += ax * dt;
        it.dy += ay * dt;
        it.x += it.dx * dt;
        it.y += it.dy * dt;
        if (Math.hypot(it.hx - it.x, it.hy - it.y) < 0.5 && Math.hypot(it.dx, it.dy) < 5) it.mode = 'fall';
      }
      // 画面の外へ出きったら、上か左からやり直す（つまんでいる間と戻る途中は除く）
      if (it.mode === 'fall' && (it.hx > w + it.size || it.hy > h + it.size)) respawn(it, false);
      it.el.style.transform = `translate3d(${it.x}px, ${it.y}px, 0) rotate(${it.rot}deg)`;
    }
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); // タブ復帰時の飛びを防ぐ
    last = t;
    step(dt);
    raf = requestAnimationFrame(frame);
  }

  const shuffled = [...sources].sort(() => Math.random() - 0.5);
  const count = Math.min(COUNT_MAX, Math.max(shuffled.length, shuffled.length ? 6 : 0));
  for (let i = 0; i < count; i++) make(shuffled[i % shuffled.length]);

  function start() {
    if (running || !items.length) return;
    if (!placed && layer.clientWidth > 0) {
      items.forEach((it) => respawn(it, true));
      placed = true;
    }
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!layer.closest('[hidden]')) start();
  });

  return { start, stop, items };
}

// イラスト未完成時の試用（?demo=1）。動物名の入った丸い札を SVG で作る。
export function demoSources() {
  const colors = ['#FFDDBB', '#D3ECF7', '#FDE8C8', '#E3F1F8'];
  return ['リス', 'コアラ', 'たぬき', 'ねこ'].map((name, i) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="54" fill="${colors[i]}" stroke="#EFA46A" stroke-width="4" stroke-dasharray="10 8"/>
      <text x="60" y="68" font-size="24" text-anchor="middle" fill="#8F7B68" font-family="sans-serif">${name}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
