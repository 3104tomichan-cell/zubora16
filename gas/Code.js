// ずぼら16タイプ診断所：匿名の回答を受け取り、スプレッドシートに1行ずつ書き込む。
// 個人を特定できる情報は受け取らないし、書き込まない（IP アドレスなども記録しない）。
// 受信時刻は10分単位に丸めて記録する。

const IDS = [
  'A1-1', 'A1-2', 'A1-3', 'A2-1', 'A2-2', 'A2-3', 'A3-1', 'A3-2', 'A3-3', 'A4-1', 'A4-2', 'A4-3',
  'Z-1', 'Z-2', 'Z-3', 'Z-4', 'Z-5', 'Z-6', 'Z-7', 'Z-8', 'Z-9', 'Z-10', 'Z-11', 'Z-12', 'Z-13', 'Z-14', 'Z-15',
];
const HEADER = ['受信時刻（10分単位）', 'version', 'session', 'mode', 'test', 'type', 'zRaw', 'A1', 'A2', 'A3', 'A4'].concat(IDS);
const SHEET_NAME = '回答';

// 最初に一度だけ実行する。記録用のスプレッドシートを作り、ID を保存する。
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SHEET_ID')) {
    Logger.log('作成済み: ' + SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getUrl());
    return;
  }
  const ss = SpreadsheetApp.create('ずぼら16タイプ診断所_回答記録_2026');
  const sheet = ss.getSheets()[0];
  sheet.setName(SHEET_NAME);
  sheet.appendRow(HEADER);
  sheet.setFrozenRows(1);
  props.setProperty('SHEET_ID', ss.getId());
  Logger.log('作成しました: ' + ss.getUrl());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const row = toRow(data);
    if (!row) return text('ignored');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
      SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME).appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return text('ok');
  } catch (err) {
    return text('error');
  }
}

// 動作確認用（ブラウザで URL を開くと ok と出る）
// ?view=summary を付けると、タイプ別の人数の集計ページを返す（&test=1 で動作確認の回答も含める）
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.view === 'summary') return summaryPage(p.test === '1');
  return text('ok');
}

const TYPE_NAMES = {
  '01': '陰で頑張るリス', '02': '完全防御型リス', '03': '発信系リス', '04': '直進型リス',
  '05': 'コソ練コアラ', '06': '忍者タイプコアラ', '07': '前向きコアラ', '08': 'ノーガードコアラ',
  '09': '自主トレ中たぬき', '10': '擬態型たぬき', '11': 'がんばり中たぬき', '12': 'ありのままたぬき',
  '13': 'こっそり系ねこ', '14': '秘密主義のねこ', '15': '行進中ねこ', '16': '我が道直進ねこ',
};
// "10" などは数字として先に並んでしまうため、表示順は配列で持つ
const TYPE_IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16'];

// 集計だけを返す。個々の回答の中身は出さない。
function summaryPage(includeTest) {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  const rows = SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME).getDataRange().getValues().slice(1);
  const col = (name) => HEADER.indexOf(name);
  const counts = {};
  TYPE_IDS.forEach((k) => { counts[k] = 0; });
  let total = 0;
  let testCount = 0;
  let zSum = 0;
  rows.forEach((r) => {
    const isTest = r[col('test')] === true || r[col('test')] === 'TRUE';
    if (isTest) testCount++;
    if (isTest && !includeTest) return;
    const t = String(r[col('type')]).padStart(2, '0');
    if (!(t in counts)) return;
    counts[t]++;
    total++;
    zSum += 10 + Number(r[col('zRaw')]);
  });
  const max = Math.max(1, ...Object.values(counts));
  const list = TYPE_IDS.map((k) => {
    const n = counts[k];
    const pct = total ? Math.round((n / total) * 100) : 0;
    return `<tr><td>${TYPE_NAMES[k]}</td><td class="n">${n}</td><td class="bar"><span style="width:${(n / max) * 100}%"></span></td><td class="n">${pct}%</td></tr>`;
  }).join('');
  const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'M/d HH:mm');
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ずぼら診断 集計</title><style>
body{margin:0;padding:16px;background:#FFF8EE;color:#5B4636;font-family:'Hiragino Maru Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 12px;font-size:13px;color:#8F7B68}
.box{display:flex;gap:8px;margin:0 0 14px}.box div{flex:1;background:#FFFDF8;border:2px solid #F0E3D2;border-radius:14px;padding:10px;text-align:center}
.box b{display:block;font-size:24px}table{width:100%;border-collapse:collapse;background:#FFFDF8;border-radius:14px;overflow:hidden}
td{padding:7px 8px;border-bottom:1px solid #F0E3D2;font-size:14px;white-space:nowrap}td.n{text-align:right;width:3em}
td.bar{width:40%}td.bar span{display:block;height:12px;border-radius:6px;background:#EFA46A}
a{color:#5E9DBE}</style></head><body>
<h1>ずぼら16タイプ診断所 集計</h1>
<p>${now} 時点${includeTest ? '（動作確認の回答を含む）' : '（動作確認の回答を除く）'}。ページを再読み込みすると最新になります。</p>
<div class="box"><div>回答数<b>${total}</b></div><div>平均ずぼら度<b>${total ? Math.round(zSum / total) : '-'}%</b></div></div>
<table>${list}</table>
<p style="margin-top:12px">動作確認の回答：${testCount}件　<a href="${ScriptApp.getService().getUrl()}?view=summary${includeTest ? '' : '&test=1'}" target="_top">${includeTest ? '本番の回答だけ表示' : '動作確認の回答も含めて表示'}</a></p>
</body></html>`;
  return HtmlService.createHtmlOutput(html)
    .setTitle('ずぼら診断 集計')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function toRow(d) {
  if (!d || typeof d !== 'object' || !d.answers) return null;
  const answers = IDS.map((id) => d.answers[id]);
  if (answers.some((v) => !Number.isInteger(v) || v < 0 || v > 6)) return null;
  const axes = d.axes || {};
  const t = new Date();
  t.setMinutes(Math.floor(t.getMinutes() / 10) * 10, 0, 0);
  return [
    Utilities.formatDate(t, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'),
    String(d.v || '').slice(0, 20),
    String(d.sid || '').slice(0, 40),
    d.mode === 'staff' ? 'staff' : 'self',
    d.test === true,
    String(d.type || '').slice(0, 4),
    Number(d.zRaw),
    Number(axes.A1), Number(axes.A2), Number(axes.A3), Number(axes.A4),
  ].concat(answers);
}

function text(s) {
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.TEXT);
}
