/**
 * 進行画面の下部に添える名言。
 *
 * ことわざは使わず、出典のはっきりした人物の言葉だけを置いている。
 * 訳文は日本語として読みやすいよう整えた要約・意訳を含むので、
 * 文言を確定させる前に原典を当たること（source に原典を記録している）。
 * 日替わりで変わるよう日数から決定論的に選ぶ（乱数だと再描画で入れ替わる）。
 */

export interface Quote {
  text: string;
  author: string;
  /** 原典。表示はしないが、文言を検証するための出所として残す */
  source: string;
}

/** 自分語りタイム: 語ること・本音・自己欺瞞について */
const EPISODE_QUOTES: Quote[] = [
  {
    text: "確信は、真実にとって嘘よりも危険な敵である。",
    author: "フリードリヒ・ニーチェ",
    source: "『人間的、あまりに人間的』483",
  },
  {
    text: "人は他人を欺くより先に、自分自身を欺いている。",
    author: "ラ・ロシュフコー",
    source: "『箴言集』（要約）",
  },
  {
    text: "真実を語るには二人が必要だ。話す者と、聞く者と。",
    author: "ヘンリー・D・ソロー",
    source: "『コンコード川とメリマック川の一週間』",
  },
  {
    text: "真実は小説よりも奇なり。",
    author: "マーク・トウェイン",
    source: "『赤道に沿って』",
  },
  {
    text: "嘘をついたあとには、よい記憶力が必要になる。",
    author: "ピエール・コルネイユ",
    source: "戯曲『嘘つき』",
  },
];

/** 犯人探しタイム: 疑い・信頼・見抜くことについて */
const DISCUSSION_QUOTES: Quote[] = [
  {
    text: "利益のために結ばれた友は、利益がなくなれば離れていく。",
    author: "アリストテレス",
    source: "『ニコマコス倫理学』第八巻（要約）",
  },
  {
    text: "疑いは、つねに罪ある心にまとわりつく。",
    author: "ウィリアム・シェイクスピア",
    source: "『ヘンリー六世 第三部』",
  },
  {
    text: "人は、自分が信じたいことを喜んで信じる。",
    author: "ユリウス・カエサル",
    source: "『ガリア戦記』第三巻",
  },
  {
    text: "嘘をつかれたことではない。もう信じられないことが、私を打ちのめした。",
    author: "フリードリヒ・ニーチェ",
    source: "『善悪の彼岸』183",
  },
  {
    text: "事実は頑固なものだ。",
    author: "ジョン・アダムズ",
    source: "「ボストン虐殺事件」弁論",
  },
];

/** 追放されなかった朝の語り（名言ではなく地の文） */
export const PEACEFUL_MORNING = "嗚呼。深く澄み渡る、\n風もない清寂の朝だ。";

const pick = (pool: Quote[], day: number) => pool[Math.abs(day - 1) % pool.length];

export const episodeQuote = (day: number) => pick(EPISODE_QUOTES, day);
export const discussionQuote = (day: number) => pick(DISCUSSION_QUOTES, day);
