// 回答の記録。失敗しても診断には影響させない。
// 記録するもの：生の回答（0〜6、逆転前）、各軸の得点、ずぼら度の素点、タイプID、
// アプリのバージョン、入力方法、ランダムなセッションID、ニックネーム（任意。入力欄で本名を入れないよう案内）。
// 時刻は受け取る側で10分単位に丸める。
// 記録しないもの：連絡先・SNSアカウント・端末固有のID。
import { APP_VERSION, RECORD_ENDPOINT } from './config.js';

function randomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildRecord({ answers, result, mode, test, nick = '' }) {
  return {
    v: APP_VERSION,
    sid: randomId(),
    mode, // 'self'＝来場者のスマホ / 'staff'＝紙からスタッフが入力
    test: Boolean(test),
    answers,
    axes: result.axes,
    zRaw: result.zuboraRaw,
    type: result.type.id,
    nick: String(nick).slice(0, 10),
  };
}

// 送れなかった記録はこの端末に取っておき、次に開いたときや電波が戻ったときに送り直す
const QUEUE_KEY = 'zubora-unsent';
function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50))); } catch { /* 保存できなくても続ける */ }
}

function post(record, endpoint) {
  // Apps Script は CORS の応答を返さないので、no-cors で送る（届いたかどうかの中身は見られない）
  return fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(record),
    keepalive: true,
  });
}

export function sendRecord(record, endpoint = RECORD_ENDPOINT) {
  if (!endpoint) return;
  try {
    post(record, endpoint).catch(() => {
      // 通信できなかった（圏外など）。あとで送り直す
      writeQueue(readQueue().concat([record]));
    });
  } catch {
    // 何もしない
  }
}

let flushing = false;
export function flushQueue(endpoint = RECORD_ENDPOINT) {
  if (!endpoint || flushing) return;
  const q = readQueue();
  if (!q.length) return;
  flushing = true;
  writeQueue([]);
  Promise.all(q.map((r) => post(r, endpoint).then(() => null, () => r)))
    .then((left) => {
      const rest = left.filter(Boolean);
      if (rest.length) writeQueue(readQueue().concat(rest));
    })
    .finally(() => { flushing = false; });
}
