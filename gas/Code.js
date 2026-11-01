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
function doGet() {
  return text('ok');
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
