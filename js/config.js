// 年ごとに差し替える値はここにまとめる。

export const APP_VERSION = '2026.0.1';

// 偏差値の基準。x はずぼら度の素点（0〜90）。
// 【推定値】来年は今年の実測値に置き換える。根拠：
//   mean：TIPI-J（小塩ら, 2012, 大学生902名）の勤勉性の平均 6.14（2〜14点）から、
//         1問あたり「ずぼら側」に 3.93（0〜6点）と見て 15問分 ≒ 59
//   sd  ：同論文の項目SD ≒ 1.45、設問間の平均相関 .25（Clark & Watson の推奨範囲 .15〜.50 の中ほど）として
//         √(15 × 1.45² × (1 + 14 × .25)) ≒ 12
export const DEVIATION = {
  mean: 59,
  sd: 12,
  min: 20, // 表示の下限
  max: 80, // 表示の上限
  digits: 1, // 小数点以下の桁数
};

// 軸の判定：この点数以上を高得点側にする（0〜18点、9点は低得点側）
export const AXIS_THRESHOLD = 10;

// ずぼら度（表示）= 基礎点 + 素点
export const ZUBORA_BASE = 10;

// 回答の記録先（Google Apps Script のウェブアプリの URL）。空なら記録しない。
export const RECORD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvisfnuhw1GRnsxjgtwrRsMuwxJYWWa9SUpEUs3E1ELSkiQhYj2SOyhGl3EWql_zHW/exec';

// イラストを置いたタイプの ID。assets/types/{id}.svg を読みに行く。
// 例：['01', '05']
export const ILLUSTRATIONS = [];
export const ILLUSTRATION_EXT = 'svg';

// シェア画像の下部に入れる企画情報
export const EVENT = {
  title: 'ずぼら16タイプ診断所',
  place: '第77回駒場祭　11/21（土）5号館 517教室',
};
