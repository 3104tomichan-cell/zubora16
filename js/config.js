// 年ごとに差し替える値はここにまとめる。

// 2026.0.2（11/21 当日）：A4-1「仮眠を取る」→「とりあえずだらける」、A2-2 に「どんなに」を追加
// 2026.0.3（11/21 当日 昼）：A2（範囲）の判定ラインを 10→13 点に上げる（下の AXIS_THRESHOLD）
export const APP_VERSION = '2026.0.3';

// 偏差値の基準。x はずぼら度の素点（0〜90）。
// 【調整値】全問「どちらでもない」（素点45）が偏差値50になるように平均を中立点45に置き、
// ばらつき（sd）は実態の推定（約12）より大きい20にして、全体が高めに出すぎないようにしている。
// 参考（公開データからの推定）：mean≒59, sd≒12
//   mean：TIPI-J（小塩ら, 2012, 大学生902名）の勤勉性の平均 6.14（2〜14点）から、
//         1問あたり「ずぼら側」に 3.93（0〜6点）と見て 15問分 ≒ 59
//   sd  ：同論文の項目SD ≒ 1.45、設問間の平均相関 .25（Clark & Watson の推奨範囲 .15〜.50 の中ほど）として
//         √(15 × 1.45² × (1 + 14 × .25)) ≒ 12
// 来年は今年の実測値（記録した回答）に置き換える。
export const DEVIATION = {
  mean: 45,
  sd: 20,
  min: 20, // 表示の下限
  max: 80, // 表示の上限
  digits: 1, // 小数点以下の桁数
};

// 軸の判定：この点数以上を高得点側にする（0〜18点）。
// A2（範囲）は質問がほとんどの人に当てはまり、10点では本番の85%が高得点側になって
// リスとたぬきばかり出たため、11/21 昼の本番回答55件でほぼ半々（13点以上が29人）になる 13 にした。
export const AXIS_THRESHOLD = { A1: 10, A2: 13, A3: 10, A4: 10 };

// ずぼら度（表示）= 基礎点 + 素点
export const ZUBORA_BASE = 10;

// 回答の記録先（Google Apps Script のウェブアプリの URL）。空なら記録しない。
export const RECORD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvisfnuhw1GRnsxjgtwrRsMuwxJYWWa9SUpEUs3E1ELSkiQhYj2SOyhGl3EWql_zHW/exec';

// イラストを置いたタイプの ID。assets/types/{id}.{拡張子} を読みに行く。
export const ILLUSTRATIONS = ['01', '02', '03', '04', '05', '06', '07', '08',
  '09', '10', '11', '12', '13', '14', '15', '16'];
export const ILLUSTRATION_EXT = 'webp';

// スタート画面のロゴ。ファイルがなければ何も表示しない。
export const LOGO = 'assets/logo.png';

// シェア画像の下部に入れる企画情報
export const EVENT = {
  title: 'ずぼら16タイプ診断所',
  place: '第77回駒場祭　11/21（土）5号館 517教室',
};
