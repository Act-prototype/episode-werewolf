import { useEffect, useState, ReactNode } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { IconBadge } from "@/components/IconBadge";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";
import { InfoNote } from "@/components/InfoNote";
import { GameMenu } from "@/components/GameMenu";
import { haptics } from "@/components/haptics";
import { getTopicForTheme } from "@/game/episodeThemes";
import { generateAITheme } from "@/game/aiTheme";
import { loadCardState, clearCardState, CardGameState } from "@/game/storage";
import { colors, radius, space } from "@/theme/tokens";

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
  const [doubtResult, setDoubtResult] = useState<{ doubterIndex: number | null; targetIndex: number | null; isSuccess: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      const state = await loadCardState();
      if (!state) return router.replace("/");
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
        distributed.push(cards.slice(i * state.cardsPerPlayer, i * state.cardsPerPlayer + state.cardsPerPlayer));
      }
      setPlayerCards(distributed);
      setPlayers(state.playerNames.map((name) => ({ name, cards: state.cardsPerPlayer, usedCards: 0, werewolfCardsUsed: 0, finished: false })));

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
      const topic = await generateAITheme(gameState.selectedTheme, aiPrompt || undefined);
      setCurrentTopic(topic.topic);
      setCurrentCategory(topic.category);
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
    const updated = [...selectedCards, { playerIndex: selectingPlayer, cardType: selectedType!, cardIndex: selectedIndex! }];
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

  const doubtPlayer = (targetIndex: number) => {
    const target = selectedCards.find((sc) => sc.playerIndex === targetIndex);
    if (!target) return;
    const success = target.cardType === "werewolf";
    success ? haptics.success() : haptics.warning();
    setDoubtResult({ doubterIndex: doubtingPlayer, targetIndex, isSuccess: success });
    setPhase("reveal");
  };

  const passDoubt = () => {
    let next = doubtingPlayer + 1;
    while (next < players.length && players[next].cards === 0) next++;
    if (next >= players.length) {
      setDoubtResult({ doubterIndex: null, targetIndex: null, isSuccess: false });
      setPhase("reveal");
    } else {
      setDoubtingPlayer(next);
    }
  };

  const processRoundEnd = (newPlayers: PlayerState[], newCards: CardType[][], penalized: number) => {
    const byPlayer: Record<number, number[]> = {};
    selectedCards.forEach((sc) => {
      if (penalized !== -1 && sc.playerIndex === penalized) return;
      (byPlayer[sc.playerIndex] ||= []).push(sc.cardIndex);
    });
    selectedCards.forEach((sc) => {
      if (penalized !== -1 && sc.playerIndex === penalized) return;
      newPlayers[sc.playerIndex].usedCards += 1;
      newPlayers[sc.playerIndex].cards -= 1;
      if (sc.cardType === "werewolf") newPlayers[sc.playerIndex].werewolfCardsUsed += 1;
    });
    Object.entries(byPlayer).forEach(([idx, indices]) => {
      indices.sort((a, b) => b - a).forEach((i) => newCards[parseInt(idx)].splice(i, 1));
    });
    setPlayers(newPlayers);
    setPlayerCards(newCards);
    checkWinner(newPlayers);
  };

  const checkWinner = (updated: PlayerState[]) => {
    const finished = updated.filter((p) => p.cards === 0);
    if (finished.length > 0) {
      const winner = finished.reduce((prev, cur) => (cur.werewolfCardsUsed > prev.werewolfCardsUsed ? cur : prev));
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
    setPhase("themeAnnouncement");
    const topic = getTopicForTheme(gameState!.selectedTheme);
    setCurrentTopic(topic.topic);
    setCurrentCategory(topic.category);
  };

  const restart = async () => {
    await clearCardState();
    router.replace("/");
  };

  // ---- テーマ発表 ----
  if (phase === "themeAnnouncement") {
    return (
      <Screen scroll={false} background={colors.ink50}>
        <DuelHeader title="カードモード" subtitle={`Day${gameState.currentRound}`} />
        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} style={{ width: "100%", gap: space.xl }}>
            <Card elevation="raised" style={{ alignItems: "center", paddingVertical: 32 }}>
              <View style={styles.themeTag}><Text style={styles.themeTagText}>TODAY'S THEME</Text></View>
              {!!currentCategory && <Text style={styles.themeCat}>{currentCategory}</Text>}
              <Text style={styles.themeTopic}>「{currentTopic}」</Text>
            </Card>
            <InfoNote>このテーマでエピソードを話します{"\n"}テーマを変えたい場合は下のボタンから</InfoNote>
            <View style={styles.rowGap}>
              <AppButton style={{ flex: 1 }} size="sm" variant="secondary" icon="refresh" label="テーマを変える" onPress={changeTopic} />
              <AppButton style={{ flex: 1 }} size="sm" variant="ai" icon="theme" label="AIで生成" onPress={() => setShowAI(!showAI)} />
            </View>
            {showAI && (
              <Card style={{ gap: space.md }}>
                <TextInput value={aiPrompt} onChangeText={setAiPrompt} placeholder="例: 食べ物に関するテーマ、もっと面白く" placeholderTextColor={colors.ink400} style={styles.aiInput} />
                <AppButton size="sm" loading={generating} icon="theme" label={generating ? "生成中..." : "AIで生成"} onPress={genAI} />
              </Card>
            )}
            <AppButton label="このテーマで始める" onPress={() => setPhase("cardSelect")} />
          </Animated.View>
        </ScrollView>
      </Screen>
    );
  }

  // ---- カード選択 ----
  if (phase === "cardSelect") {
    const cur = players[selectingPlayer];
    const list = playerCards[selectingPlayer] || [];
    return (
      <Screen scroll={false} background={colors.ink50}>
        <DuelHeader
          title="カードモード"
          subtitle={`Day${gameState.currentRound}`}
          right={<Text style={styles.headerMeta}>{selectedCards.length}/{activeCount} 選択完了</Text>}
        >
          <PlayerChips players={players} highlight={selectingPlayer} selectedIndices={selectedCards.map((s) => s.playerIndex)} />
        </DuelHeader>

        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          {!showCard ? (
            <Animated.View key="select" entering={FadeIn} style={{ width: "100%", gap: space.xl }}>
              <Card elevation="raised" style={{ alignItems: "center", paddingVertical: 28 }}>
                <IconBadge icon="villager" box={96} size={48} rounded="circle" bg={colors.ink900} />
                <Text style={styles.bigName}>{cur.name}</Text>
                <Text style={styles.subName}>カードを選んでください</Text>
                <Text style={styles.remain}>残り {cur.cards} 枚</Text>
              </Card>
              <View style={styles.miniTheme}>
                {!!currentCategory && <Text style={styles.miniThemeCat}>{currentCategory}</Text>}
                <Text style={styles.miniThemeTopic}>{currentTopic}</Text>
              </View>
              <Text style={styles.pickHint}>カードを1枚選んでください</Text>
              <View style={styles.cardGrid}>
                {list.map((_, index) => (
                  <PressableScale key={index} haptic={false} onPress={() => pickCard(index)} style={styles.faceDown}>
                    <Icon name="cardBack" size={40} color={colors.white} />
                  </PressableScale>
                ))}
              </View>
            </Animated.View>
          ) : (
            <RevealedCard
              type={selectedType!}
              note="このカードを覚えておいてください。全員がカードを選んだら、順番にエピソードを話します。"
              buttonLabel="次のプレイヤーへ"
              onNext={confirmCard}
            />
          )}
        </ScrollView>
      </Screen>
    );
  }

  // ---- エピソード発表 ----
  if (phase === "episode") {
    const idx = selectedCards.findIndex((sc) => sc.playerIndex === episodePlayer);
    const isLast = idx === selectedCards.length - 1;
    return (
      <Screen scroll={false} background={colors.ink50}>
        <DuelHeader title="エピソード発表" subtitle={`${idx + 1} / ${selectedCards.length}`} />
        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown} style={{ width: "100%", gap: space.xl }}>
            <Card elevation="raised" style={{ alignItems: "center", paddingVertical: 28 }}>
              <IconBadge icon="acting" box={96} size={48} rounded="circle" bg={colors.ink900} />
              <Text style={styles.bigName}>{players[episodePlayer].name}</Text>
              <Text style={styles.subName}>がエピソードを話します</Text>
            </Card>
            <Card style={{ alignItems: "center" }}>
              <Text style={styles.miniThemeCat}>トピック</Text>
              <Text style={styles.topicLarge}>{currentTopic}</Text>
            </Card>
            <InfoNote>{players[episodePlayer].name}さん、選んだカードに従ってエピソードを話してください。</InfoNote>
            <AppButton label={isLast ? "ダウトタイムへ進む" : "次のプレイヤーへ"} onPress={nextEpisode} />
          </Animated.View>
        </ScrollView>
      </Screen>
    );
  }

  // ---- ダウト ----
  if (phase === "doubt") {
    const doubter = players[doubtingPlayer];
    return (
      <Screen scroll={false} background={colors.ink50}>
        <DuelHeader
          title="ダウトタイム"
          subtitle="誰かをダウトしますか？"
          right={<Text style={styles.headerMeta}>{doubtingPlayer + 1}/{activeCount}</Text>}
        >
          <PlayerChips players={players} highlight={doubtingPlayer} hideFinished />
        </DuelHeader>

        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} style={{ width: "100%", gap: space.xl }}>
            <Card elevation="raised" style={{ alignItems: "center", paddingVertical: 28 }}>
              <IconBadge icon="thinking" box={96} size={48} rounded="circle" bg={colors.ink900} />
              <Text style={styles.bigName}>{doubter.name}</Text>
              <Text style={styles.subName}>誰をダウトしますか？</Text>
            </Card>
            <Card>
              <View style={{ flexDirection: "row", gap: space.md }}>
                <Icon name="alert" size={24} color={colors.ink600} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.doubtLead}>誰かのエピソードが人狼カード（嘘）だと思いますか？</Text>
                  <Text style={styles.doubtFine}>・ダウト成功 → 出した人にカード+1枚{"\n"}・ダウト失敗 → ダウトした人にカード+1枚</Text>
                </View>
              </View>
            </Card>
            <Text style={styles.pickHint}>ダウトする相手を選択</Text>
            {selectedCards.map((sc, i) => {
              if (sc.playerIndex === doubtingPlayer) return null;
              return (
                <AppButton key={i} variant="danger" icon="target" label={`${players[sc.playerIndex].name} をダウト！`} onPress={() => doubtPlayer(sc.playerIndex)} />
              );
            })}
            <AppButton variant="primary" icon="check" label="パス（信じる）" onPress={passDoubt} />
          </Animated.View>
        </ScrollView>
      </Screen>
    );
  }

  // ---- カード公開 ----
  if (phase === "reveal") {
    // 全員パス
    if (doubtResult?.doubterIndex === null) {
      return (
        <Screen scroll={false} background={colors.ink50}>
          <DuelHeader title="カード公開" subtitle="全員パス" />
          <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
            <Text style={styles.revealHead}>今回出したカード</Text>
            <View style={{ width: "100%", gap: space.md }}>
              {selectedCards.map((sc, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(i * 120)}>
                  <PlayedCardRow name={players[sc.playerIndex].name} type={sc.cardType} large />
                </Animated.View>
              ))}
            </View>
            <AppButton style={{ marginTop: space.xl }} label="次のラウンドへ" onPress={() => processRoundEnd(players, playerCards, -1)} />
          </ScrollView>
        </Screen>
      );
    }

    const targetCard = selectedCards.find((sc) => sc.playerIndex === doubtResult?.targetIndex);
    const targetPlayer = players[doubtResult?.targetIndex ?? 0];
    const doubterPlayer = players[doubtResult?.doubterIndex ?? 0];
    const wolf = targetCard?.cardType === "werewolf";
    const success = !!doubtResult?.isSuccess;

    return (
      <Screen scroll={false} background={colors.ink50}>
        <DuelHeader title="カード公開" subtitle={`${doubterPlayer.name} が ${targetPlayer.name} をダウト！`} />
        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} style={{ width: "100%", gap: space.xl }}>
            <View style={[styles.bigRoleCard, { backgroundColor: wolf ? colors.wolf : colors.villager }]}>
              <Icon name={wolf ? "wolf" : "villager"} size={96} color={colors.white} />
              <Text style={styles.bigRoleName}>{wolf ? "人狼" : "村人"}カード</Text>
              <Text style={styles.bigRoleSub}>{targetPlayer.name} のカード</Text>
            </View>

            <View style={[styles.outcome, { backgroundColor: success ? colors.successSurface : colors.dangerSurface, borderColor: success ? colors.successBorder : colors.dangerBorder }]}>
              <Icon name={success ? "success" : "fail"} size={56} color={success ? colors.successBorder : colors.dangerBorder} />
              <Text style={[styles.outcomeTitle, { color: success ? colors.successText : colors.dangerText }]}>{success ? "ダウト成功！" : "ダウト失敗！"}</Text>
              <Text style={[styles.outcomeSub, { color: success ? colors.successText : colors.dangerText }]}>
                {success ? `${targetPlayer.name} にカード+1枚` : `${doubterPlayer.name} にカード+1枚`}
              </Text>
            </View>

            <View style={{ gap: space.sm }}>
              <Text style={styles.playedHead}>今回出したカード</Text>
              {selectedCards.map((sc, i) => (
                <PlayedCardRow key={i} name={players[sc.playerIndex].name} type={sc.cardType} />
              ))}
            </View>

            <AppButton
              label="次のラウンドへ"
              onPress={() => {
                if (success) {
                  const np = [...players];
                  np[doubtResult!.targetIndex!].cards += 1;
                  const nc = [...playerCards];
                  nc[doubtResult!.targetIndex!] = [...nc[doubtResult!.targetIndex!], "villager"];
                  processRoundEnd(np, nc, doubtResult!.targetIndex!);
                } else {
                  const np = [...players];
                  np[doubtResult!.doubterIndex!].cards += 1;
                  const nc = [...playerCards];
                  nc[doubtResult!.doubterIndex!] = [...nc[doubtResult!.doubterIndex!], "villager"];
                  processRoundEnd(np, nc, -1);
                }
              }}
            />
          </Animated.View>
        </ScrollView>
      </Screen>
    );
  }

  // ---- 結果 ----
  if (phase === "result") {
    return (
      <Screen scroll={false} background={colors.ink50}>
        <DuelHeader title="ゲーム終了！" subtitle="" hero right={<GameMenu mode="card" showRules={false} />} />
        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn} style={{ width: "100%", gap: space.xl }}>
            <Card elevation="raised" style={{ alignItems: "center", paddingVertical: 36, borderWidth: 4, borderColor: colors.ink300 }}>
              <Icon name="celebrate" size={72} color={colors.ink900} />
              <Text style={styles.winnerName}>{gameState.winner}</Text>
              <Text style={styles.winnerSub}>の勝利！</Text>
            </Card>
            <Card>
              <Text style={styles.statsHead}>ゲーム統計</Text>
              <View style={styles.statRow}>
                <Text style={styles.statKey}>総日数</Text>
                <Text style={styles.statVal}>Day{gameState.currentRound}</Text>
              </View>
              {players.map((p, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={styles.statName}>{p.name}</Text>
                  <View style={styles.statWolf}>
                    <Icon name="wolf" size={16} color={colors.wolf} />
                    <Text style={styles.statWolfText}>{p.werewolfCardsUsed}枚使用</Text>
                  </View>
                </View>
              ))}
            </Card>
            <AppButton label="トップに戻る" icon="home" onPress={restart} />
          </Animated.View>
        </ScrollView>
      </Screen>
    );
  }

  return null;
}

/* ---------- 部品 ---------- */

function DuelHeader({
  title,
  subtitle,
  right,
  children,
  hero,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
  children?: ReactNode;
  hero?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.dHeader, { paddingTop: insets.top + space.lg }, hero && { paddingVertical: space["4xl"], alignItems: "center" }]}>
      <View style={styles.dHeaderRow}>
        <View style={hero ? { alignItems: "center" } : undefined}>
          {hero && <Icon name="trophy" size={56} color={colors.white} />}
          <Text style={[styles.dTitle, hero && { fontSize: 32, marginTop: space.md }]}>{title}</Text>
          {!!subtitle && <Text style={styles.dSub}>{subtitle}</Text>}
        </View>
        {right && !hero && right}
        {!right && !hero && <GameMenu mode="card" />}
      </View>
      {hero && right ? <View style={styles.heroRight}>{right}</View> : null}
      {children}
    </View>
  );
}

function PlayerChips({
  players,
  highlight,
  selectedIndices = [],
  hideFinished,
}: {
  players: PlayerState[];
  highlight: number;
  selectedIndices?: number[];
  hideFinished?: boolean;
}) {
  return (
    <View style={styles.chipGrid}>
      {players.map((p, idx) => {
        if (hideFinished && p.cards === 0) return null;
        const picked = selectedIndices.includes(idx);
        return (
          <View key={idx} style={[styles.pChip, idx === highlight && styles.pChipActive, picked && { opacity: 0.6 }]}>
            <View style={styles.pChipTop}>
              {picked && <Icon name="check" size={12} color={colors.white} />}
              <Text style={styles.pChipName} numberOfLines={1}>{p.name}</Text>
            </View>
            <Text style={styles.pChipCards}>{p.cards === 0 ? "完了" : `${p.cards}枚`}</Text>
          </View>
        );
      })}
    </View>
  );
}

function RevealedCard({ type, note, buttonLabel, onNext }: { type: CardType; note: string; buttonLabel: string; onNext: () => void }) {
  const wolf = type === "werewolf";
  return (
    <Animated.View key="confirm" entering={FadeIn} style={{ width: "100%", gap: space.xl }}>
      <View style={[styles.bigRoleCard, { backgroundColor: wolf ? colors.wolf : colors.villager }]}>
        <Icon name={wolf ? "wolf" : "villager"} size={88} color={colors.white} />
        <Text style={styles.bigRoleName}>{wolf ? "人狼" : "村人"}カード</Text>
        <Text style={styles.bigRoleSub}>{wolf ? "嘘のエピソードを話す" : "本当のエピソードを話す"}</Text>
      </View>
      <InfoNote>{note}</InfoNote>
      <AppButton label={buttonLabel} onPress={onNext} />
    </Animated.View>
  );
}

function PlayedCardRow({ name, type, large }: { name: string; type: CardType; large?: boolean }) {
  const wolf = type === "werewolf";
  return (
    <View
      style={[
        styles.playedRow,
        large
          ? { backgroundColor: wolf ? colors.wolf : colors.ink800, padding: space.lg }
          : { backgroundColor: wolf ? colors.wolfSurface : colors.ink100, borderWidth: 2, borderColor: wolf ? colors.wolfBorder : colors.ink300, padding: space.md },
      ]}
    >
      <View style={styles.playedLeft}>
        <Icon name={wolf ? "wolf" : "villager"} size={large ? 32 : 22} color={large ? colors.white : wolf ? colors.wolf : colors.ink700} />
        <Text style={[styles.playedName, { color: large ? colors.white : wolf ? colors.wolfText : colors.ink900, fontSize: large ? 17 : 14 }]}>{name}</Text>
      </View>
      <Text style={[styles.playedType, { color: large ? "rgba(255,255,255,0.85)" : wolf ? colors.wolf : colors.ink700 }]}>
        {wolf ? "人狼" : "村人"}{large ? "カード" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dHeader: { backgroundColor: colors.ink900, paddingHorizontal: space["2xl"], paddingBottom: space.xl, gap: space.md },
  dHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dTitle: { fontSize: 22, fontWeight: "800", color: colors.white },
  dSub: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  heroRight: { position: "absolute", right: space["2xl"] },
  headerMeta: { color: colors.white, fontSize: 12, fontWeight: "700" },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  pChip: { flexGrow: 1, flexBasis: "47%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  pChipActive: { borderWidth: 2, borderColor: colors.white },
  pChipTop: { flexDirection: "row", alignItems: "center", gap: 4 },
  pChipName: { color: colors.white, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  pChipCards: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "700", marginTop: 2 },

  center: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: space["2xl"], gap: space.lg },

  themeTag: { backgroundColor: colors.ink900, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, marginBottom: space.lg },
  themeTagText: { color: colors.white, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  themeCat: { fontSize: 14, fontWeight: "700", color: colors.ink500, marginBottom: space.sm },
  themeTopic: { fontSize: 22, fontWeight: "800", color: colors.ink800, textAlign: "center" },

  rowGap: { flexDirection: "row", gap: space.sm },
  aiInput: { height: 44, borderRadius: radius.md, borderWidth: 2, borderColor: colors.ink200, backgroundColor: colors.ink50, paddingHorizontal: 12, fontSize: 14, fontWeight: "500", color: colors.ink900 },

  bigName: { fontSize: 34, fontWeight: "800", color: colors.ink800, marginTop: space.md },
  subName: { fontSize: 15, fontWeight: "700", color: colors.ink600, marginTop: 2 },
  remain: { fontSize: 14, fontWeight: "700", color: colors.ink600, marginTop: space.md },

  miniTheme: { backgroundColor: colors.ink100, borderRadius: radius.xl, padding: space.lg, borderWidth: 1, borderColor: colors.ink200, alignItems: "center", width: "100%" },
  miniThemeCat: { fontSize: 12, fontWeight: "700", color: colors.ink500, marginBottom: 2 },
  miniThemeTopic: { fontSize: 16, fontWeight: "800", color: colors.ink800 },
  topicLarge: { fontSize: 20, fontWeight: "800", color: colors.ink800, marginTop: 4 },

  pickHint: { fontSize: 14, fontWeight: "700", color: colors.ink600, textAlign: "center" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "center" },
  faceDown: { width: 88, aspectRatio: 2 / 3, borderRadius: radius.xl, backgroundColor: colors.ink800, alignItems: "center", justifyContent: "center" },

  doubtLead: { fontSize: 14, fontWeight: "700", color: colors.ink700, marginBottom: space.sm },
  doubtFine: { fontSize: 12, fontWeight: "600", color: colors.ink600, lineHeight: 18 },

  bigRoleCard: { borderRadius: radius["3xl"], paddingVertical: 48, alignItems: "center", gap: space.md },
  bigRoleName: { fontSize: 40, fontWeight: "800", color: colors.white },
  bigRoleSub: { fontSize: 17, fontWeight: "700", color: "rgba(255,255,255,0.9)" },

  revealHead: { fontSize: 18, fontWeight: "800", color: colors.ink800, marginBottom: space.sm },
  outcome: { borderRadius: radius.xl, borderWidth: 4, padding: space.xl, alignItems: "center", gap: space.sm },
  outcomeTitle: { fontSize: 28, fontWeight: "800" },
  outcomeSub: { fontSize: 16, fontWeight: "700" },
  playedHead: { fontSize: 14, fontWeight: "800", color: colors.ink700, paddingHorizontal: 4 },
  playedRow: { borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  playedLeft: { flexDirection: "row", alignItems: "center", gap: space.sm },
  playedName: { fontWeight: "800" },
  playedType: { fontSize: 12, fontWeight: "700" },

  winnerName: { fontSize: 44, fontWeight: "800", color: colors.ink800, marginTop: space.lg },
  winnerSub: { fontSize: 22, fontWeight: "700", color: colors.ink600 },
  statsHead: { fontSize: 18, fontWeight: "800", color: colors.ink800, textAlign: "center", marginBottom: space.lg },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: space.md },
  statKey: { fontSize: 14, fontWeight: "700", color: colors.ink700 },
  statVal: { fontSize: 14, fontWeight: "700", color: colors.ink700 },
  statCard: { backgroundColor: colors.ink50, borderRadius: radius.md, padding: space.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.sm },
  statName: { fontSize: 15, fontWeight: "800", color: colors.ink800 },
  statWolf: { flexDirection: "row", alignItems: "center", gap: 4 },
  statWolfText: { fontSize: 13, fontWeight: "700", color: colors.ink600 },
});
