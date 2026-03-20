export interface EpisodeTheme {
  category: string;
  topics: string[];
}

export const episodeThemes: EpisodeTheme[] = [
  {
    category: "恥ずかしい失敗談",
    topics: [
      "人生で一番恥ずかしかった瞬間",
      "やらかしてしまった黒歴史",
      "誰にも言えない失敗エピソード",
      "勘違いして赤面した話",
      "思い出すと今でも恥ずかしいこと",
      "人前で大失態をした経験",
      "バレたくなかった秘密がバレた話"
    ]
  },
  {
    category: "初めての経験",
    topics: [
      "人生で一番ドキドキした初体験",
      "初めて挑戦して失敗したこと",
      "初対面の人に言われて嬉しかった言葉",
      "初めてのアルバイトの思い出",
      "初めて親に反抗した話",
      "初めて自分で決断した大きなこと",
      "初めて知って衝撃を受けた事実"
    ]
  },
  {
    category: "本音トーク",
    topics: [
      "実は今でも引きずっている過去",
      "言いたくても言えなかった本音",
      "本当は嫌だったけど我慢したこと",
      "誰にも理解されないと思っている悩み",
      "自分の性格で直したいところ",
      "実は羨ましいと思っていること",
      "心の中で密かに思っていること"
    ]
  },
  {
    category: "人間関係の話",
    topics: [
      "友達と大喧嘩した理由とその後",
      "苦手な人とどう付き合っているか",
      "信頼していた人に裏切られた経験",
      "人間関係で学んだ大切なこと",
      "誤解を解くのに苦労した話",
      "思わず泣いてしまった友人の言葉",
      "距離を置いた人との思い出"
    ]
  },
  {
    category: "後悔していること",
    topics: [
      "今でも後悔している選択",
      "やっておけばよかったと思うこと",
      "謝りたいけど謝れていないこと",
      "戻れるなら変えたい過去",
      "チャンスを逃して後悔した話",
      "言わなければよかったと思う一言",
      "もっと早く気づけばよかったこと"
    ]
  },
  {
    category: "価値観・考え方",
    topics: [
      "人生観が変わった出来事",
      "絶対に譲れないこだわり",
      "周りと違う自分の価値観",
      "最近考え方が変わったこと",
      "大切にしている信念や哲学",
      "常識だと思われているけど疑問に思うこと",
      "自分らしさとは何だと思うか"
    ]
  },
  {
    category: "恋愛・好きな人",
    topics: [
      "忘れられない恋愛エピソード",
      "告白して成功または失敗した話",
      "恋愛で傷ついた経験",
      "理想のデートと現実の差",
      "好きな人にした勇気ある行動",
      "恋愛で後悔していること",
      "運命を感じた瞬間"
    ]
  },
  {
    category: "夢・目標・野望",
    topics: [
      "本気で叶えたい夢",
      "誰にも話していない野望",
      "挫折した夢とその理由",
      "いつか絶対にやりたいこと",
      "周りに反対されている目標",
      "夢を諦めそうになった瞬間",
      "理想の自分と現実のギャップ"
    ]
  }
];

export const SHUFFLE_THEME = "シャッフル";

export function getTopicForTheme(themeName: string): { category: string; topic: string } {
  if (themeName === SHUFFLE_THEME) {
    return getRandomTopic();
  }
  return getRandomTopicFromTheme(themeName);
}

export function getRandomTopicFromTheme(themeName: string): { category: string; topic: string } {
  const theme = episodeThemes.find(t => t.category === themeName);
  if (!theme) {
    const randomTheme = episodeThemes[Math.floor(Math.random() * episodeThemes.length)];
    const topic = randomTheme.topics[Math.floor(Math.random() * randomTheme.topics.length)];
    return {
      category: randomTheme.category,
      topic: topic
    };
  }
  const topic = theme.topics[Math.floor(Math.random() * theme.topics.length)];
  return {
    category: theme.category,
    topic: topic
  };
}

export function getRandomTopic(): { category: string; topic: string } {
  const theme = episodeThemes[Math.floor(Math.random() * episodeThemes.length)];
  const topic = theme.topics[Math.floor(Math.random() * theme.topics.length)];
  return {
    category: theme.category,
    topic: topic
  };
}
