// 採点と判定。画面に依存しない純粋な関数だけを置く（tests/ でテストする）。
import { QUESTIONS, LAST_ID, PAPER_ORDER } from './questions.js';
import { TYPES, ANIMALS } from './types.js';
import { AXIS_THRESHOLD, ZUBORA_BASE, DEVIATION } from './config.js';

export const AXES = ['A1', 'A2', 'A3', 'A4'];

// 逆転処理後の点数（0〜6）
export function itemScore(question, raw) {
  return question.reverse ? 6 - raw : raw;
}

// answers: { 'A1-1': 0〜6, ... }（逆転前の生の値。左端「そう思う」が6）
export function score(answers) {
  const axes = { A1: 0, A2: 0, A3: 0, A4: 0 };
  let zuboraRaw = 0;
  for (const q of QUESTIONS) {
    const raw = answers[q.id];
    if (!Number.isInteger(raw) || raw < 0 || raw > 6) {
      throw new Error(`回答が不正です: ${q.id}=${raw}`);
    }
    const s = itemScore(q, raw);
    if (q.axis === 'Z') zuboraRaw += s;
    else axes[q.axis] += s;
  }
  return { axes, zuboraRaw };
}

export function isHigh(axisScore) {
  return axisScore >= AXIS_THRESHOLD;
}

export function findType({ hide, improve, stray, focus }) {
  const animal = Object.keys(ANIMALS).find(
    (k) => ANIMALS[k].stray === stray && ANIMALS[k].focus === focus,
  );
  return TYPES.find((t) => t.animal === animal && t.hide === hide && t.improve === improve);
}

export function typeFromAxes(axes) {
  return findType({
    hide: isHigh(axes.A1),
    focus: isHigh(axes.A2),
    improve: isHigh(axes.A3),
    stray: isHigh(axes.A4),
  });
}

// 表示用のずぼら度（10〜100%）
export function zuboraPercent(zuboraRaw) {
  return ZUBORA_BASE + zuboraRaw;
}

// T = 50 + 10 × (x − μ) ÷ σ を表示範囲に丸める
export function deviation(zuboraRaw, d = DEVIATION) {
  const t = 50 + (10 * (zuboraRaw - d.mean)) / d.sd;
  const clamped = Math.min(d.max, Math.max(d.min, t));
  const p = 10 ** d.digits;
  return Math.round(clamped * p) / p;
}

export function diagnose(answers) {
  const { axes, zuboraRaw } = score(answers);
  const type = typeFromAxes(axes);
  return {
    axes,
    zuboraRaw,
    zuboraPercent: zuboraPercent(zuboraRaw),
    deviation: deviation(zuboraRaw),
    type,
  };
}

// 出題順。Z-15 以外をシャッフルして、Z-15 を最後に置く。
export function questionOrder({ fixed = false, random = Math.random } = {}) {
  if (fixed) return [...PAPER_ORDER];
  const ids = QUESTIONS.map((q) => q.id).filter((id) => id !== LAST_ID);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  ids.push(LAST_ID);
  return ids;
}
