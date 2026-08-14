import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PressableScale } from "@/components/PressableScale";
import { GameHeader } from "@/components/sketch/GameHeader";
import { RoleArt } from "@/components/sketch/RoleArt";
import { SketchButton } from "@/components/sketch/SketchButton";
import { SketchDivider } from "@/components/sketch/SketchDivider";
import { SketchFrame } from "@/components/sketch/SketchFrame";
import { SketchNumber } from "@/components/sketch/SketchNumber";
import { SketchOptionRow } from "@/components/sketch/SketchOptionRow";
import { SketchQuote } from "@/components/sketch/SketchQuote";
import { ThemeFrame } from "@/components/sketch/ThemeFrame";
import { ThemePill } from "@/components/sketch/ThemePill";
import { AiThemeBox } from "@/components/sketch/AiThemeBox";
import { haptics } from "@/components/haptics";
import { getTopicForTheme } from "@/game/episodeThemes";
import { generateAITheme } from "@/game/aiTheme";
import { episodeQuote } from "@/game/quotes";
import { loadCardState, clearCardState, CardGameState } from "@/game/storage";
import { sketch } from "@/theme/sketchAssets";
import { colors, radius, space, type } from "@/theme/tokens";

type CardType = "werewolf" | "villager";
type Phase = "themeAnnouncement" | "cardSelect" | "episode" | "doubt" | "result" | "reveal";

interface PlayerState {
  name: string;
  cards: number;
  usedCards: number;
  werewolfCardsUsed: number;
  finished: boolean;
}
interface SelectedCard {
  playerIndex: number;
  cardType: CardType;
  cardIndex: number;
}
/** 1件のダウト。誰が誰を疑い、当たったか */
interface Doubt {
  doubterIndex: number;
  targetIndex: number;
  isSuccess: boolean;
}

export default function Duel() {
  const router = useRouter();
  const [gameState, setGameState] = useState<CardGameState | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [playerCards, setPlayerCards] = useState<CardType[][]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [phase, setPhase] = useState<Phase>("themeAnnouncement");
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [selectingPlayer, setSelectingPlayer] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<CardType | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [episodePlayer, setEpisodePlayer] = useState(0);
  const [doubtingPlayer, setDoubtingPlayer] = useState(0);
  /** 全員のダウトを溜める。1人が疑った時点では終わらせず、順番に回す */
  const [doubts, setDoubts] = useState<Doubt[]>([]);

  useEffect(() => {
    (async () => {
      const state = await loadCardState();
      if (!state) return router.replace("/mode-select");
      setGameState(state);

      const total = state.playerNames.length * state.cardsPerPlayer;
      const cards: CardType[] = [];
      for (let i = 0; i < state.werewolfCardCount; i++) cards.push("werewolf");
      for (let i = 0; i < total - state.werewolfCardCount; i++) cards.push("villager");
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      const distributed: CardType[][] = [];
      for (let i = 0; i < state.playerNames.length; i++) {
        distributed.push(
          cards.slice(i * state.cardsPerPlayer, i * state.cardsPerPlayer + state.cardsPerPlayer)
        );
      }
      setPlayerCards(distributed);
      setPlayers(
        state.playerNames.map((name) => ({
          name,
          cards: state.cardsPerPlayer,
          usedCards: 0,
          werewolfCardsUsed: 0,
          finished: false,
        }))
      );

      const topic = getTopicForTheme(state.selectedTheme);
      setCurrentTopic(topic.topic);
      setCurrentCategory(topic.category);
    })();
  }, []);

  if (!gameState || players.length === 0) return <Screen>{null}</Screen>;

  const activeCount = players.filter((p) => p.cards > 0).length;

  const changeTopic = () => {
    const topic = getTopicForTheme(gameState.selectedTheme);
    setCurrentTopic(topic.topic);
    setCurrentCategory(topic.category);
  };

  const genAI = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const generated = await generateAITheme({
        category: gameState.selectedTheme,
        currentTopic,
        customPrompt: aiPrompt || undefined,
      });
      setCurrentTopic(generated.topic);
      setCurrentCategory(generated.category);
      setAiPrompt("");
    } catch (e) {
      console.error("AI theme generation failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const pickCard = (index: number) => {
    haptics.reveal();
    setSelectedIndex(index);
    setSelectedType(playerCards[selectingPlayer][index]);
    setShowCard(true);
  };

  const confirmCard = () => {
    const updated = [
      ...selectedCards,
      { playerIndex: selectingPlayer, cardType: selectedType!, cardIndex: selectedIndex! },
    ];
    setSelectedCards(updated);

    let next = selectingPlayer + 1;
    while (next < players.length && players[next].cards === 0) next++;

    setShowCard(false);
    setSelectedIndex(null);
    setSelectedType(null);

    if (next >= players.length) {
      setEpisodePlayer(updated[0].playerIndex);
      setPhase("episode");
    } else {
      setSelectingPlayer(next);
    }
  };

  const nextEpisode = () => {
    const idx = selectedCards.findIndex((sc) => sc.playerIndex === episodePlayer);
    if (idx < selectedCards.length - 1) {
      setEpisodePlayer(selectedCards[idx + 1].playerIndex);
    } else {
      let first = 0;
      while (first < players.length && players[first].cards === 0) first++;
      setDoubtingPlayer(first);
      setPhase("doubt");
    }
  };

  /** 次のプレイヤーへ回す。全員が終わったらカード公開へ */
  const advanceDoubt = () => {
    let next = doubtingPlayer + 1;
    while (next < players.length && players[next].cards === 0) next++;
    if (next >= players.length) setPhase("reveal");
    else setDoubtingPlayer(next);
  };

  const doubtPlayer = (targetIndex: number) => {
    const target = selectedCards.find((sc) => sc.playerIndex === targetIndex);
    if (!target) return;
    const success = target.cardType === "werewolf";
    success ? haptics.success() : haptics.warning();
    setDoubts((prev) => [...prev, { doubterIndex: doubtingPlayer, targetIndex, isSuccess: success }]);
    advanceDoubt();
  };

  const passDoubt = () => {
    haptics.select();
    advanceDoubt();
  };

  /** 出したカードを消費し、ダウトの罰を反映してラウンドを閉じる */
  const processRoundEnd = () => {
    const newPlayers = players.map((p) => ({ ...p }));
    const newCards = playerCards.map((c) => [...c]);

    // 出したカードは全員が消費する
    const byPlayer: Record<number, number[]> = {};
    selectedCards.forEach((sc) => {
      (byPlayer[sc.playerIndex] ||= []).push(sc.cardIndex);
      newPlayers[sc.playerIndex].usedCards += 1;
      newPlayers[sc.playerIndex].cards -= 1;
      if (sc.cardType === "werewolf") newPlayers[sc.playerIndex].werewolfCardsUsed += 1;
    });
    Object.entries(byPlayer).forEach(([idx, indices]) => {
      indices.sort((a, b) => b - a).forEach((i) => newCards[parseInt(idx)].splice(i, 1));
    });

    // ダウト1件ごとに罰として1枚増える。当たれば出した人、外せば疑った人。
    doubts.forEach((d) => {
      const penalized = d.isSuccess ? d.targetIndex : d.doubterIndex;
      newPlayers[penalized].cards += 1;
      newCards[penalized] = [...newCards[penalized], "villager"];
    });

    setPlayers(newPlayers);
    setPlayerCards(newCards);
    checkWinner(newPlayers);
  };

  const checkWinner = (updated: PlayerState[]) => {
    const finished = updated.filter((p) => p.cards === 0);
    if (finished.length > 0) {
      const winner = finished.reduce((prev, cur) =>
        cur.werewolfCardsUsed > prev.werewolfCardsUsed ? cur : prev
      );
      setGameState({ ...gameState!, winner: winner.name });
      haptics.success();
      setPhase("result");
    } else {
      nextRound();
    }
  };

  const nextRound = () => {
    setGameState({ ...gameState!, currentRound: gameState!.currentRound + 1 });
    let first = 0;
    while (first < players.length && players[first].cards === 0) first++;
    setSelectingPlayer(first);
    setSelectedCards([]);
    setSelectedIndex(null);
    setSelectedType(null);
    setShowCard(false);
    setDoubts([]);
    setPhase("themeAnnouncement");
    const topic = getTopicForTheme(gameState!.selectedTheme);
    setCurrentTopic(topic.topic);
    setCurrentCategory(topic.category);
  };

  const restart = async () => {
    await clearCardState();
    router.replace("/mode-select");
  };

  /** 進行画面の外枠。ヘッダーと余白を全フェーズで揃える */
  const Frame = ({ children }: { children: React.ReactNode }) => (
    <Screen scroll={false} edges={{ top: false, bottom: true }} avoidKeyboard>
      <GameHeader day={gameState.currentRound} mode="card" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
    </Screen>
  );

  // ---- テーマ発表 ----
  if (phase === "themeAnnouncement") {
    return (
      <Frame>
        <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
          <Text style={styles.phaseTitle}>テーマ発表</Text>

          <ThemeFrame topic={currentTopic} category={currentCategory} withCat />

          <View style={styles.pillRow}>
            <ThemePill label="テーマを変更" onPress={changeTopic} />
            <ThemePill label="AIでつくる" ai onPress={() => setShowAI(!showAI)} />
          </View>

          {showAI && (
            <AiThemeBox
              value={aiPrompt}
              onChangeText={setAiPrompt}
              onSubmit={genAI}
              loading={generating}
            />
          )}

          <Roster players={players} />

          <SketchButton
            label="カードをえらぶ"
            onPress={() => setPhase("cardSelect")}
            style={styles.cta}
          />
        </Animated.View>
      </Frame>
    );
  }

  // ---- カード選択 ----
  if (phase === "cardSelect") {
    const cur = players[selectingPlayer];
    const list = playerCards[selectingPlayer] || [];
    return (
      <Frame>
        {!showCard ? (
          <Animated.View key="select" entering={FadeIn.duration(220)} style={styles.stack}>
            <Text style={styles.phaseTitle}>カードをえらぶ</Text>
            <Text style={styles.phaseLead}>
              {selectedCards.length} / {activeCount} 人おわり
            </Text>

            <SketchFrame style={styles.frameWidth} contentStyle={styles.turnFrame}>
              <Image source={sketch.humanSolid} style={styles.turnAvatar} resizeMode="contain" />
              <Text style={styles.turnName}>{cur.name}のばん</Text>
            </SketchFrame>

            <Text style={styles.phaseLead}>
              「{currentTopic}」{"\n"}に合うカードを1枚えらぶ（残り {cur.cards} 枚）
            </Text>

            <View style={styles.cardGrid}>
              {list.map((_, index) => (
                <PressableScale
                  key={index}
                  haptic={false}
                  onPress={() => pickCard(index)}
                  style={styles.faceDown}
                >
                  <SketchNumber value={index + 1} height={26} />
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        ) : (
          <RevealedCard
            type={selectedType!}
            note="このカードを覚えておいて。全員がえらんだら順番に話します。"
            buttonLabel="次のプレイヤーへ"
            onNext={confirmCard}
          />
        )}
      </Frame>
    );
  }

  // ---- エピソード発表 ----
  if (phase === "episode") {
    const idx = selectedCards.findIndex((sc) => sc.playerIndex === episodePlayer);
    const isLast = idx === selectedCards.length - 1;
    return (
      <Frame>
        <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
          <Text style={styles.phaseTitle}>自分語りタイム</Text>
          <Text style={styles.phaseLead}>
            {idx + 1} / {selectedCards.length} 人目
          </Text>

          <SketchFrame style={styles.frameWidth} contentStyle={styles.turnFrame}>
            <Image source={sketch.humanSolid} style={styles.turnAvatar} resizeMode="contain" />
            <Text style={styles.turnName}>{players[episodePlayer].name}のばん</Text>
          </SketchFrame>

          <ThemeFrame topic={currentTopic} category={currentCategory} />

          <Text style={styles.phaseLead}>えらんだカードに従って話すのだ。</Text>

          <SketchQuote quote={episodeQuote(gameState.currentRound)} />

          <SketchButton
            label={isLast ? "ダウトタイムへ" : "次のプレイヤーへ"}
            onPress={nextEpisode}
            style={styles.cta}
          />
        </Animated.View>
      </Frame>
    );
  }

  // ---- ダウト ----
  if (phase === "doubt") {
    const doubter = players[doubtingPlayer];
    // 手札が残っている人だけを数えた「何人目か」
    const doubtOrder = players.slice(0, doubtingPlayer).filter((p) => p.cards > 0).length;
    return (
      <Frame>
        <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
          <View style={styles.titleWithRule}>
            <Text style={styles.phaseTitle}>ダウトタイム</Text>
            <SketchDivider weight="fine" width={110} height={3} />
          </View>
          <Text style={styles.phaseLead}>
            嘘だと思うエピソードを選べ{"\n"}当たれば相手に+1枚、外せば自分に+1枚
          </Text>
          <Text style={styles.phaseLead}>
            {doubtOrder + 1} / {activeCount} 人目
          </Text>

          <SketchFrame style={styles.frameWidth} contentStyle={styles.turnFrame}>
            <Image source={sketch.humanSolid} style={styles.turnAvatar} resizeMode="contain" />
            <Text style={styles.turnName}>{doubter.name}のばん</Text>
          </SketchFrame>

          <View style={styles.optionList}>
            {selectedCards.map((sc, i) =>
              sc.playerIndex === doubtingPlayer ? null : (
                <SketchOptionRow
                  key={i}
                  label={`${players[sc.playerIndex].name} をダウト`}
                  onPress={() => doubtPlayer(sc.playerIndex)}
                />
              )
            )}
            <SketchOptionRow label="パス（信じる）" onPress={passDoubt} />
          </View>
        </Animated.View>
      </Frame>
    );
  }

  // ---- カード公開 ----
  if (phase === "reveal") {
    return (
      <Frame>
        <Animated.View entering={FadeIn.duration(260)} style={styles.stack}>
          <Text style={styles.phaseTitle}>カード公開</Text>

          <View style={styles.optionList}>
            {selectedCards.map((sc, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(i * 110)}>
                <PlayedCardRow name={players[sc.playerIndex].name} type={sc.cardType} large />
              </Animated.View>
            ))}
          </View>

          <SketchDivider weight="hair" width={240} height={4} />

          {doubts.length === 0 ? (
            <Text style={styles.phaseLead}>誰もダウトしなかった...</Text>
          ) : (
            <View style={styles.doubtResults}>
              {doubts.map((d, i) => (
                <View key={i} style={styles.doubtResult}>
                  <Text style={styles.doubtWho}>
                    {players[d.doubterIndex].name} → {players[d.targetIndex].name}
                  </Text>
                  <Text style={styles.doubtOutcome}>
                    <Text style={{ color: d.isSuccess ? colors.villager : colors.wolf }}>
                      【{d.isSuccess ? "成功" : "失敗"}】
                    </Text>
                    {"  "}
                    {players[d.isSuccess ? d.targetIndex : d.doubterIndex].name} に+1枚
                  </Text>
                </View>
              ))}
            </View>
          )}

          <SketchButton label="次のラウンドへ" onPress={processRoundEnd} style={styles.cta} />
        </Animated.View>
      </Frame>
    );
  }

  // ---- 結果 ----
  if (phase === "result") {
    return (
      <Frame>
        <Animated.View entering={FadeIn.duration(260)} style={styles.stack}>
          <Text style={styles.phaseTitle}>ゲーム終了</Text>

          <View style={styles.winnerBlock}>
            <Text style={styles.winnerName}>{gameState.winner}</Text>
            <Text style={styles.verdict}>の勝ち</Text>
          </View>
          <SketchDivider weight="medium" width={180} height={5} />

          <View style={styles.statList}>
            {players.map((p, i) => (
              <View key={i} style={styles.statRow}>
                <RoleArt role="人狼" size={30} />
                <Text style={styles.statName}>{p.name}</Text>
                <Text style={styles.statValue}>人狼カード {p.werewolfCardsUsed}枚</Text>
              </View>
            ))}
          </View>

          <SketchButton label="トップに戻る" onPress={restart} style={styles.cta} />
        </Animated.View>
      </Frame>
    );
  }

  return null;
}

/* ---------- 部品 ---------- */

/** 参加者の一覧。名前の下に手書き罫線を引き、残り枚数を添える */
function Roster({ players }: { players: PlayerState[] }) {
  return (
    <View style={styles.roster}>
      {players.map((p, i) => (
        <View key={i} style={styles.rosterItem}>
          <Text style={styles.rosterName}>
            {p.name}
            {p.cards > 0 ? `　${p.cards}枚` : "　あがり"}
          </Text>
          <SketchDivider weight="fine" width={150} height={3} />
        </View>
      ))}
    </View>
  );
}

/** 自分が引いたカードの確認。役職確認と同じ形で見せる */
function RevealedCard({
  type,
  note,
  buttonLabel,
  onNext,
}: {
  type: CardType;
  note: string;
  buttonLabel: string;
  onNext: () => void;
}) {
  const wolf = type === "werewolf";
  return (
    <Animated.View key="confirm" entering={FadeIn.duration(260)} style={styles.stack}>
      <Text style={styles.phaseTitle}>あなたのカード</Text>

      <SketchFrame style={styles.frameWidth} contentStyle={styles.roleCard}>
        <RoleArt role={wolf ? "人狼" : "村人"} size={150} />
        <Text style={styles.roleCardName}>{wolf ? "人狼" : "村人"}カード</Text>
      </SketchFrame>

      <Text style={styles.phaseLead}>
        {wolf ? "うそのエピソードを話す" : "ほんとうにあったハナシを話す"}
      </Text>
      <Text style={styles.phaseLead}>{note}</Text>

      <SketchButton label={buttonLabel} onPress={onNext} style={styles.cta} />
    </Animated.View>
  );
}

/** 公開された1枚。人狼だけ赤で示す */
function PlayedCardRow({
  name,
  type,
  large,
}: {
  name: string;
  type: CardType;
  large?: boolean;
}) {
  const wolf = type === "werewolf";
  return (
    <View
      style={[
        styles.playedRow,
        { borderColor: wolf ? colors.wolf : colors.ink300 },
        large ? { padding: space.lg } : { padding: space.md },
      ]}
    >
      <View style={styles.playedLeft}>
        <RoleArt role={wolf ? "人狼" : "村人"} size={large ? 38 : 26} />
        <Text style={[styles.playedName, { fontSize: large ? 17 : 14 }]}>{name}</Text>
      </View>
      <Text style={[styles.playedType, { color: wolf ? colors.wolf : colors.inkSub }]}>
        {wolf ? "人狼" : "村人"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: space.xl, paddingBottom: space["3xl"] },
  stack: { alignItems: "center", gap: space.lg, paddingTop: space.lg },

  phaseTitle: { ...type.h2, color: colors.ink, textAlign: "center" },
  phaseLead: { ...type.small, color: colors.inkSub, textAlign: "center", lineHeight: 20 },
  titleWithRule: { alignItems: "center", gap: space.xs },

  pillRow: { flexDirection: "row", gap: space.md },

  roster: { alignItems: "center", gap: space.md, marginTop: space.sm },
  rosterItem: { alignItems: "center", gap: 2 },
  rosterName: { ...type.title, color: colors.ink },

  // stack が中央寄せなので、囲みの幅は明示しないと端まで伸びる
  frameWidth: { width: "100%", maxWidth: 333 },
  turnFrame: { alignItems: "center", paddingVertical: space.sm, gap: space.md },
  turnAvatar: { width: 62, height: 110 },
  turnName: { ...type.title, color: colors.ink, textAlign: "center" },

  // カード裏面の手書き素材が無いため、インクの細枠 + 手書き数字で表す
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "center" },
  faceDown: {
    width: 72,
    aspectRatio: 2 / 3,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.ink300,
    alignItems: "center",
    justifyContent: "center",
  },

  roleCard: { alignItems: "center", paddingVertical: space.sm, gap: space.md },
  roleCardName: { ...type.title, color: colors.ink },

  verdict: {
    ...type.display,
    fontFamily: type.title.fontFamily,
    color: colors.ink,
    textAlign: "center",
  },

  optionList: { width: "100%", gap: space.md },

  doubtResults: { width: "100%", gap: space.md },
  doubtResult: { alignItems: "center", gap: 2 },
  doubtWho: { ...type.body, color: colors.ink, textAlign: "center" },
  doubtOutcome: { ...type.small, color: colors.inkSub, textAlign: "center" },
  playedRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playedLeft: { flexDirection: "row", alignItems: "center", gap: space.sm },
  playedName: { ...type.title, color: colors.ink },
  playedType: { ...type.small },

  winnerBlock: { alignItems: "center", marginTop: space.xl },
  winnerName: { ...type.display, color: colors.ink, textAlign: "center" },
  statList: { width: "100%", gap: space.sm, marginTop: space.lg },
  statRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  statName: { ...type.body, color: colors.ink, flex: 1 },
  statValue: { ...type.small, color: colors.inkSub },

  cta: { width: "100%", maxWidth: 320, marginTop: space.xl },
});
