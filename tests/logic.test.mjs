// 実行：リポジトリのいちばん上のフォルダで `node --test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, LAST_ID, PAPER_ORDER, PAGE_SIZE } from '../js/questions.js';
import { TYPES } from '../js/types.js';
import {
  score, diagnose, typeFromAxes, zuboraPercent, deviation, questionOrder, isHigh,
} from '../js/logic.js';

const all = (v) => Object.fromEntries(QUESTIONS.map((q) => [q.id, v]));

test('設問は27問、IDの重複なし、逆転の数が資料どおり', () => {
  assert.equal(QUESTIONS.length, 27);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 27);
  for (const axis of ['A1', 'A2', 'A3', 'A4']) {
    const qs = QUESTIONS.filter((q) => q.axis === axis);
    assert.equal(qs.length, 3, axis);
  }
  const rev = (axis) => QUESTIONS.filter((q) => q.axis === axis && q.reverse).length;
  assert.equal(rev('A1'), 1);
  assert.equal(rev('A2'), 1);
  assert.equal(rev('A3'), 1);
  assert.equal(rev('A4'), 2); // A4-1 と A4-3
  assert.equal(QUESTIONS.filter((q) => q.axis === 'Z').length, 15);
  assert.equal(rev('Z'), 7);
});

test('逆転項目のID（資料 4.3 の※）', () => {
  const reversed = QUESTIONS.filter((q) => q.reverse).map((q) => q.id).sort();
  assert.deepEqual(reversed, [
    'A1-3', 'A2-3', 'A3-3', 'A4-1', 'A4-3',
    'Z-1', 'Z-11', 'Z-12', 'Z-13', 'Z-14', 'Z-3', 'Z-8',
  ].sort());
});

test('全問6点（全部「そう思う」）', () => {
  const { axes, zuboraRaw } = score(all(6));
  // A1〜A3：正転2問×6 + 逆転1問×0 = 12
  assert.deepEqual(axes, { A1: 12, A2: 12, A3: 12, A4: 6 });
  // ずぼら度：正転8問×6 + 逆転7問×0 = 48
  assert.equal(zuboraRaw, 48);
});

test('全問0点（全部「そう思わない」）', () => {
  const { axes, zuboraRaw } = score(all(0));
  assert.deepEqual(axes, { A1: 6, A2: 6, A3: 6, A4: 12 });
  assert.equal(zuboraRaw, 42);
});

test('全問3点（全部「どちらでもない」）', () => {
  const { axes, zuboraRaw } = score(all(3));
  assert.deepEqual(axes, { A1: 9, A2: 9, A3: 9, A4: 9 });
  assert.equal(zuboraRaw, 45);
});

test('軸4の向き：止まる行動（A4-1, A4-3）に「そう思う」→ 止まる側（低）', () => {
  const a = all(3);
  a['A4-1'] = 6; a['A4-2'] = 0; a['A4-3'] = 6;
  assert.equal(score(a).axes.A4, 0);
  assert.equal(diagnose(a).type.animal === 'risu' || diagnose(a).type.animal === 'koala', true);
});

test('軸4の向き：逸れる行動（A4-2）に「そう思う」→ 逸れる側（高）', () => {
  const a = all(3);
  a['A4-1'] = 0; a['A4-2'] = 6; a['A4-3'] = 0;
  assert.equal(score(a).axes.A4, 18);
  assert.ok(['tanuki', 'neko'].includes(diagnose(a).type.animal));
});

test('同点（9点）は低得点側、10点から高得点側', () => {
  assert.equal(isHigh(9), false);
  assert.equal(isHigh(10), true);
  assert.equal(isHigh(0), false);
  assert.equal(isHigh(18), true);
  // 全部3点 → 全軸9点 → 全軸が低得点側 → 止まる×全方位＝コアラ、全開×改善なし
  assert.equal(diagnose(all(3)).type.name, 'ノーガードコアラ');
});

test('16タイプすべてに到達でき、資料の表どおりの名前になる', () => {
  const expected = {
    // [隠す, 改善, 逸れる, こだわり] → 名前
    '1101': '陰で頑張るリス', '1001': '完全防御型リス', '0101': '発信系リス', '0001': '直進型リス',
    '1100': 'コソ練コアラ', '1000': '忍者タイプコアラ', '0100': '前向きコアラ', '0000': 'ノーガードコアラ',
    '1111': '自主トレ中たぬき', '1011': '擬態型たぬき', '0111': 'がんばり中たぬき', '0011': 'ありのままたぬき',
    '1110': 'こっそり系ねこ', '1010': '秘密主義のねこ', '0110': '行進中ねこ', '0010': '我が道直進ねこ',
  };
  const seen = new Set();
  for (const [key, name] of Object.entries(expected)) {
    const [hide, improve, stray, focus] = key.split('').map((c) => c === '1');
    const axes = { A1: hide ? 10 : 9, A3: improve ? 10 : 9, A4: stray ? 10 : 9, A2: focus ? 10 : 9 };
    const t = typeFromAxes(axes);
    assert.equal(t.name, name, key);
    seen.add(t.id);
  }
  assert.equal(seen.size, 16);
  assert.equal(TYPES.length, 16);
});

test('16タイプすべてに、実際の回答から到達できる', () => {
  // 各軸を高/低にする回答を組み立てて diagnose を通す
  const seen = new Set();
  for (let mask = 0; mask < 16; mask++) {
    const a = all(3);
    ['A1', 'A2', 'A3', 'A4'].forEach((axis, i) => {
      const high = Boolean(mask & (1 << i));
      for (const q of QUESTIONS.filter((x) => x.axis === axis)) {
        const s = high ? 6 : 0; // 逆転後の点数
        a[q.id] = q.reverse ? 6 - s : s;
      }
    });
    seen.add(diagnose(a).type.id);
  }
  assert.equal(seen.size, 16);
});

test('ずぼら度は10%〜100%', () => {
  const min = all(0); const max = all(0);
  for (const q of QUESTIONS.filter((x) => x.axis === 'Z')) {
    min[q.id] = q.reverse ? 6 : 0;
    max[q.id] = q.reverse ? 0 : 6;
  }
  assert.equal(score(min).zuboraRaw, 0);
  assert.equal(score(max).zuboraRaw, 90);
  assert.equal(zuboraPercent(0), 10);
  assert.equal(zuboraPercent(90), 100);
});

test('偏差値の式と表示範囲', () => {
  const d = { mean: 45, sd: 15, min: 20, max: 80, digits: 1 };
  assert.equal(deviation(45, d), 50);
  assert.equal(deviation(60, d), 60);
  assert.equal(deviation(30, d), 40);
  assert.equal(deviation(90, { ...d, sd: 5 }), 80); // 上限で止まる
  assert.equal(deviation(0, { ...d, sd: 5 }), 20); // 下限で止まる
  assert.equal(deviation(52, { ...d, sd: 14 }), 55);
});

test('回答の欠けや範囲外はエラー', () => {
  const a = all(3);
  delete a['Z-4'];
  assert.throws(() => score(a));
  assert.throws(() => score({ ...all(3), 'A1-1': 7 }));
});

test('シャッフルしても Z-15 は最後、27問がそろう', () => {
  for (let i = 0; i < 500; i++) {
    const order = questionOrder();
    assert.equal(order.length, 27);
    assert.equal(order[26], LAST_ID);
    assert.equal(new Set(order).size, 27);
  }
});

test('シャッフルが偏っていない（1問目に来る設問がばらつく）', () => {
  const first = new Set();
  for (let i = 0; i < 2000; i++) first.add(questionOrder()[0]);
  assert.equal(first.size, 26);
});

test('紙の順番：27問すべて1回ずつ、Z-15 が最後、3ページで割り切れる', () => {
  assert.equal(PAPER_ORDER.length, 27);
  assert.deepEqual([...PAPER_ORDER].sort(), QUESTIONS.map((q) => q.id).sort());
  assert.equal(PAPER_ORDER[26], LAST_ID);
  assert.equal(questionOrder({ fixed: true }).join(), PAPER_ORDER.join());
  assert.equal(27 % PAGE_SIZE, 0);
});
