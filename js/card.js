// 結果の一枚絵（1080×1350）を Canvas で描く。シェア画像も兼ねる。
// 回答内容や個人を特定できる情報は載せない。URL も載せない。
import { ANIMALS } from './types.js';
import { EVENT } from './config.js';

export const W = 1080;
export const H = 1350;

const C = {
  bg: '#FFF8EE',
  paper: '#FFFDF8',
  line: '#F0E3D2',
  ink: '#5B4636',
  inkSoft: '#8F7B68',
  orange: '#FFDDBB',
  orangeDeep: '#EFA46A',
  blue: '#D3ECF7',
  blueDeep: '#7DB7D5',
  faint: '#EADBC8',
};

const FONT = "'ZenMaru', 'Hiragino Maru Gothic ProN', 'Hiragino Sans', sans-serif";
const font = (weight, size) => `${weight} ${size}px ${FONT}`;

// 行頭に来てはいけない文字（簡易の禁則処理）
const NO_LINE_START = '、。，．・：；？！ー…」』）〉》】ゃゅょっぁぃぅぇぉャュョッァィゥェォ';

export async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(font(500, 40), 'ずぼら'),
      document.fonts.load(font(700, 40), 'ずぼら'),
    ]);
  } catch {
    // 読めなければシステムフォントで描く
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ゆがんだ丸（背景の飾り）
function blob(ctx, cx, cy, rx, ry, color, wobble) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const n = wobble.length;
  const pts = wobble.map((k, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    if (i === 0) ctx.moveTo(mx, my);
    else ctx.quadraticCurveTo(x0, y0, mx, my);
  }
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[1];
  ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  ctx.fill();
  ctx.restore();
}

export function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line && !NO_LINE_START.includes(ch)) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitFont(ctx, text, weight, start, min, maxWidth) {
  let size = start;
  ctx.font = font(weight, size);
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(weight, size);
  }
  return size;
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawIllustration(ctx, img, animal, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 40);
  ctx.fillStyle = animal.stray ? '#EEF7FB' : '#FFF3E6';
  ctx.fill();

  if (img) {
    const s = Math.min(w / img.width, h / img.height) * 0.92;
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    return;
  }
  // イラスト未配置のときの枠
  ctx.save();
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = C.faint;
  roundRect(ctx, x + 14, y + 14, w - 28, h - 28, 30);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = C.faint;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(700, 150);
  ctx.fillText(animal.label, x + w / 2, y + h / 2 - 16);
  ctx.font = font(500, 28);
  ctx.fillStyle = C.inkSoft;
  ctx.fillText('イラスト準備中', x + w / 2, y + h - 56);
}

function drawStat(ctx, x, y, w, h, bg, label, value, unit) {
  roundRect(ctx, x, y, w, h, 36);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.fillStyle = C.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(500, 30);
  ctx.fillText(label, x + w / 2, y + 50);

  ctx.font = font(700, 86);
  const vw = ctx.measureText(value).width;
  ctx.font = font(700, 40);
  const uw = unit ? ctx.measureText(unit).width + 6 : 0;
  const left = x + (w - vw - uw) / 2;
  ctx.textAlign = 'left';
  ctx.font = font(700, 86);
  ctx.fillText(value, left, y + h - 28);
  if (unit) {
    ctx.font = font(700, 40);
    ctx.fillText(unit, left + vw + 6, y + h - 32);
  }
}

// result: { type, zuboraPercent, deviation }, imageUrl: イラストの URL（なければ null）
export async function renderCard(result, imageUrl, nick = '') {
  await ensureFonts();
  const img = await loadImage(imageUrl);
  const animal = ANIMALS[result.type.animal];

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  blob(ctx, 980, 110, 230, 200, C.orange, [1, 0.94, 1.06, 0.97, 1.04, 0.92, 1.02, 0.98]);
  blob(ctx, 90, 1270, 220, 180, C.blue, [0.96, 1.05, 0.93, 1.03, 0.98, 1.06, 0.95, 1.01]);

  // 台紙
  roundRect(ctx, 56, 56, W - 112, H - 112, 56);
  ctx.fillStyle = C.paper;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = C.line;
  ctx.stroke();

  const cx = W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = C.inkSoft;
  ctx.font = font(500, 30);
  ctx.fillText(EVENT.title, cx, 140);

  ctx.fillStyle = C.ink;
  ctx.font = font(500, 40);
  const lead = nick ? `${nick}さんのずぼらタイプは` : 'あなたのずぼらタイプは';
  fitFont(ctx, lead, 500, 40, 28, 800);
  ctx.fillText(lead, cx, 222);

  // タイプ名＋「です」を1行で中央に置く
  const name = result.type.name;
  const nameSize = fitFont(ctx, name, 700, 96, 56, 780);
  const nameW = ctx.measureText(name).width;
  ctx.font = font(500, 40);
  const desuW = ctx.measureText('です').width;
  const gap = 12;
  const startX = cx - (nameW + gap + desuW) / 2;
  ctx.textAlign = 'left';
  ctx.font = font(700, nameSize);
  ctx.fillText(name, startX, 330);
  ctx.font = font(500, 40);
  ctx.fillText('です', startX + nameW + gap, 330);

  drawIllustration(ctx, img, animal, 220, 380, 640, 390);

  drawStat(ctx, 128, 806, 400, 160, C.orange, 'ずぼら度', String(result.zuboraPercent), '%');
  drawStat(ctx, 552, 806, 400, 160, C.blue, '偏差値', result.deviation.toFixed(1), '');

  // 説明文
  ctx.fillStyle = C.ink;
  ctx.textAlign = 'left';
  ctx.font = font(500, 32);
  const lines = wrapText(ctx, result.type.desc, 820);
  const lh = 50;
  lines.slice(0, 5).forEach((l, i) => ctx.fillText(l, 130, 1032 + i * lh));

  // 下部
  ctx.textAlign = 'center';
  ctx.fillStyle = C.inkSoft;
  ctx.font = font(500, 26);
  ctx.fillText(EVENT.place, cx, 1246);
  ctx.font = font(500, 22);
  ctx.fillText('※この偏差値は推定分布に基づく簡易的なものです', cx, 1280);

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
