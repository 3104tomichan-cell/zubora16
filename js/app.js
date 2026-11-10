import { QUESTIONS, PAGE_SIZE } from './questions.js';
import { diagnose, questionOrder } from './logic.js';
import { renderCard, canvasToBlob, ensureFonts } from './card.js';
import { buildRecord, sendRecord } from './record.js';
import { createFall, demoSources } from './fall.js';
import { ILLUSTRATIONS, ILLUSTRATION_EXT, LOGO } from './config.js';

const params = new URLSearchParams(location.search);
const MODE = params.get('staff') === '1' ? 'staff' : 'self';
const TEST = params.get('test') === '1';
const STORE_KEY = `zubora-state-${MODE}`;
const BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
const TOTAL = QUESTIONS.length;
const PAGES = Math.ceil(TOTAL / PAGE_SIZE);
// 読み上げ用（画面には出さない）。添字が点数。
const DOT_LABELS = ['そう思わない', 'あまりそう思わない', 'ややそう思わない', 'どちらでもない', 'ややそう思う', 'わりとそう思う', 'そう思う'];

const $ = (sel) => document.querySelector(sel);
const screens = { start: $('#start'), quiz: $('#quiz'), result: $('#result') };
const list = $('#questions');
const tpl = $('#tpl-question');

let state = null; // { order, answers, page, nick }
let resultBlob = null;
let resultUrl = null;

function save() {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* 保存できなくても続ける */ }
}
function load() {
  try {
    const s = JSON.parse(sessionStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.order) && s.order.length === TOTAL && s.answers) return s;
  } catch { /* 無視 */ }
  return null;
}
function clearSaved() {
  try { sessionStorage.removeItem(STORE_KEY); } catch { /* 無視 */ }
}

// スタート画面の背景演出。イラストがなければ何もしない（?demo=1 で仮の絵）
const fallSources = params.get('demo') === '1'
  ? demoSources()
  : ILLUSTRATIONS.map((id) => `assets/types/${id}.${ILLUSTRATION_EXT}`);
const fall = createFall($('#fall-layer'), fallSources);

function show(name) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== name;
  window.scrollTo(0, 0);
  if (name === 'start') fall.start();
  else fall.stop();
}

function answeredCount() {
  return Object.keys(state.answers).length;
}

function updateProgress() {
  const n = answeredCount();
  $('#progress-count').textContent = n;
  $('.progress-fill').style.width = `${(n / TOTAL) * 100}%`;
}

function pageIds(page = state.page) {
  return state.order.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
}

function scrollToEl(el, block = 'center') {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block });
}

// 未回答の最初の設問を「いまの設問」にし、それ以外を薄くする
function focusNext({ scroll = true } = {}) {
  const items = [...list.children];
  const next = items.find((li) => state.answers[li.dataset.id] === undefined);
  for (const li of items) {
    li.classList.toggle('is-active', li === next);
    li.classList.toggle('is-dim', Boolean(next) && li !== next);
  }
  if (!scroll) return;
  if (next) scrollToEl(next);
  else scrollToEl($('#btn-next'), 'end');
}

function renderPage() {
  list.textContent = '';
  const offset = state.page * PAGE_SIZE;
  pageIds().forEach((id, i) => {
    const q = BY_ID[id];
    const li = tpl.content.firstElementChild.cloneNode(true);
    li.dataset.id = id;
    li.querySelector('.q-no').textContent = offset + i + 1;
    const body = li.querySelector('.q-body');
    body.textContent = q.text;
    body.id = `q-${id}`;
    const scale = li.querySelector('.scale');
    scale.setAttribute('aria-labelledby', body.id);
    for (let v = 6; v >= 0; v--) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.dataset.v = v;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(state.answers[id] === v));
      b.setAttribute('aria-label', DOT_LABELS[v]);
      scale.append(b);
    }
    list.append(li);
  });
  $('#btn-back').hidden = state.page === 0;
  $('#btn-next').textContent = state.page === PAGES - 1 ? '結果を見る' : '次へ';
  updateProgress();
  focusNext({ scroll: false });
}

list.addEventListener('click', (e) => {
  const dot = e.target.closest('.dot');
  if (!dot) return;
  const li = dot.closest('.q');
  const id = li.dataset.id;
  const first = state.answers[id] === undefined;
  state.answers[id] = Number(dot.dataset.v);
  for (const b of li.querySelectorAll('.dot')) b.setAttribute('aria-checked', String(b === dot));
  li.classList.remove('is-missing');
  save();
  updateProgress();
  // 初めて答えたときだけ次へ送る。答え直しでは画面を動かさない。
  focusNext({ scroll: first });
});

function startQuiz() {
  // ニックネームは端末の中だけで使う。記録先には送らない（record.js には渡さない）
  const nick = $('#nickname').value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 10);
  state = { order: questionOrder({ fixed: MODE === 'staff' }), answers: {}, page: 0, nick };
  save();
  show('quiz');
  renderPage();
}

$('#btn-start').addEventListener('click', startQuiz);
$('#nickname').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); startQuiz(); }
});

$('#btn-back').addEventListener('click', () => {
  if (state.page === 0) return;
  state.page -= 1;
  save();
  renderPage();
  window.scrollTo(0, 0);
});

$('#btn-next').addEventListener('click', () => {
  const missing = [...list.children].find((li) => state.answers[li.dataset.id] === undefined);
  if (missing) {
    missing.classList.remove('is-missing');
    void missing.offsetWidth; // アニメーションをやり直す
    missing.classList.add('is-missing');
    scrollToEl(missing);
    return;
  }
  if (state.page < PAGES - 1) {
    state.page += 1;
    save();
    renderPage();
    window.scrollTo(0, 0);
    return;
  }
  showResult();
});

function illustrationUrl(typeId) {
  return ILLUSTRATIONS.includes(typeId) ? `assets/types/${typeId}.${ILLUSTRATION_EXT}` : null;
}

async function showResult() {
  const result = diagnose(state.answers);
  sendRecord(buildRecord({ answers: state.answers, result, mode: MODE, test: TEST }));
  clearSaved();

  show('result');
  const img = $('#result-img');
  $('#result-wait').hidden = false;
  img.removeAttribute('src');

  const canvas = await renderCard(result, illustrationUrl(result.type.id), state.nick || '');
  resultBlob = await canvasToBlob(canvas);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = URL.createObjectURL(resultBlob);
  img.src = resultUrl;
  img.alt = `あなたのずぼらタイプは「${result.type.name}」です。ずぼら度${result.zuboraPercent}%、偏差値${result.deviation.toFixed(1)}。${result.type.desc}`;
  img.dataset.type = result.type.id;
  $('#result-wait').hidden = true;
}

$('#btn-share').addEventListener('click', async () => {
  if (!resultBlob) return;
  const name = `zubora-${$('#result-img').dataset.type}.png`;
  const file = new File([resultBlob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return; // 共有シートを閉じただけ
    }
  }
  const a = document.createElement('a');
  a.href = resultUrl;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
});

$('#btn-again').addEventListener('click', () => {
  state = null;
  $('#nickname').value = '';
  clearSaved();
  show('start');
});

// ロゴは読み込めたときだけ出す（未配置でも壊れた画像を見せない）
if (LOGO) {
  const logo = $('#start-logo');
  logo.addEventListener('load', () => { logo.hidden = false; }, { once: true });
  logo.src = LOGO;
}

// 起動
if (MODE === 'staff') $('.staff-flag').hidden = false;
ensureFonts();
state = load();
if (state) {
  show('quiz');
  renderPage();
} else {
  show('start');
}
