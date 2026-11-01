// 匿名の回答記録。失敗しても診断には影響させない。
// 記録するもの：生の回答（0〜6、逆転前）、各軸の得点、ずぼら度の素点、タイプID、
// アプリのバージョン、入力方法、ランダムなセッションID。時刻は受け取る側で10分単位に丸める。
// 記録しないもの：氏名・連絡先・SNSアカウント・端末固有のID。
import { APP_VERSION, RECORD_ENDPOINT } from './config.js';

function randomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildRecord({ answers, result, mode, test }) {
  return {
    v: APP_VERSION,
    sid: randomId(),
    mode, // 'self'＝来場者のスマホ / 'staff'＝紙からスタッフが入力
    test: Boolean(test),
    answers,
    axes: result.axes,
    zRaw: result.zuboraRaw,
    type: result.type.id,
  };
}

export function sendRecord(record, endpoint = RECORD_ENDPOINT) {
  if (!endpoint) return;
  try {
    // Apps Script は CORS の応答を返さないので、no-cors で送りっぱなしにする
    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(record),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 何もしない
  }
}
