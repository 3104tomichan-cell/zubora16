// 設問27問（引き継ぎ資料 4.3 の確定版）。文言を変えるときは本人に確認すること。
// axis: A1=人目 A2=範囲 A3=未来 A4=着手 Z=ずぼら度
// reverse: true の設問は集計時に 6 - 回答値 にする
export const QUESTIONS = [
  { id: 'A1-1', axis: 'A1', reverse: false, text: '人前ではちゃんとしている人だと思われている自信がある' },
  { id: 'A1-2', axis: 'A1', reverse: false, text: '問題が生じたとき、人に相談せず一人で抱え込むほうだ' },
  { id: 'A1-3', axis: 'A1', reverse: true, text: '自分の失敗談を話すことに抵抗はない' },

  { id: 'A2-1', axis: 'A2', reverse: false, text: '自分の興味分野には努力を惜しまない' },
  { id: 'A2-2', axis: 'A2', reverse: false, text: '好きな人に会うためなら、面倒なことでも頑張れる' },
  { id: 'A2-3', axis: 'A2', reverse: true, text: '興味のないことにも熱意を持って取り組む' },

  { id: 'A3-1', axis: 'A3', reverse: false, text: '何かの節目ごとに、自分の生活についての目標を立てがちだ' },
  { id: 'A3-2', axis: 'A3', reverse: false, text: '自分は他人の指摘を素直に受け入れられるタイプだと思う' },
  { id: 'A3-3', axis: 'A3', reverse: true, text: '「ずぼら」は自分の持ち味であって、弱みではない' },

  // 軸4は A4-1 と A4-3 が「止まる」側で逆転、A4-2 が「逸れる」側で正転
  { id: 'A4-1', axis: 'A4', reverse: true, text: '何かを始めようとする前に、仮眠を取ることが多い' },
  { id: 'A4-2', axis: 'A4', reverse: false, text: 'やらないといけないことは、始めないというより始めても集中できないタイプだ' },
  { id: 'A4-3', axis: 'A4', reverse: true, text: '気づいたら何も手を付けないまま深夜になっていることがよくある' },

  { id: 'Z-1', axis: 'Z', reverse: true, text: '課題や仕事は、締め切りより前に余裕をもって終わらせている' },
  { id: 'Z-2', axis: 'Z', reverse: false, text: '食材の賞味期限・消費期限を過ぎてしまうことがよくある' },
  { id: 'Z-3', axis: 'Z', reverse: true, text: '洗濯物は乾いたらすぐに畳んでしまっている' },
  { id: 'Z-4', axis: 'Z', reverse: false, text: '目覚まし時計を何重にもかけている' },
  { id: 'Z-5', axis: 'Z', reverse: false, text: '「この時間になったら始めよう」で始められないことが多い' },
  { id: 'Z-6', axis: 'Z', reverse: false, text: '毎日同じ時間に同じことをするのは苦手だ' },
  { id: 'Z-7', axis: 'Z', reverse: false, text: '気づいたらゴミが部屋中にたまっている' },
  { id: 'Z-8', axis: 'Z', reverse: true, text: 'お風呂のあとは、髪をきちんと乾かしてから寝る' },
  { id: 'Z-9', axis: 'Z', reverse: false, text: '相手方に言われるまで予定を忘れていることが多い' },
  { id: 'Z-10', axis: 'Z', reverse: false, text: '使っていないサービスの定期購入解除を忘れがちだ' },
  { id: 'Z-11', axis: 'Z', reverse: true, text: '休みの日でも、平日と同じくらいの時間に起きている' },
  { id: 'Z-12', axis: 'Z', reverse: true, text: '整理整頓は得意なほうだ' },
  { id: 'Z-13', axis: 'Z', reverse: true, text: '届いたメールやメッセージはなるべく早く返す' },
  { id: 'Z-14', axis: 'Z', reverse: true, text: '大事なものはなくさない自信がある' },
  { id: 'Z-15', axis: 'Z', reverse: false, text: '自分はずぼらだと思う' },
];

// 最後に固定する設問
export const LAST_ID = 'Z-15';

// 紙の回答用紙とスタッフ入力モードで使う固定の順番。
// 軸がまとまって見えないように混ぜてある。Z-15 は最後。
export const PAPER_ORDER = [
  'Z-3', 'A2-1', 'Z-9', 'A4-2', 'Z-12', 'A1-3', 'Z-5', 'A3-1', 'Z-14',
  'A1-1', 'Z-7', 'A4-3', 'Z-2', 'A2-3', 'Z-11', 'A3-3', 'Z-6', 'A4-1',
  'Z-13', 'A2-2', 'Z-1', 'A1-2', 'Z-10', 'A3-2', 'Z-8', 'Z-4', 'Z-15',
];

export const PAGE_SIZE = 9;
