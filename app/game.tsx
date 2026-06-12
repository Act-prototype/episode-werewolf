import { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { IconBadge } from "@/components/IconBadge";
import { Icon } from "@/components/Icon";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";
import { InfoNote } from "@/components/InfoNote";
import { GameMenu } from "@/components/GameMenu";
import { haptics } from "@/components/haptics";
import { GameState, GamePhase } from "@/game/types";
import { checkGameOver, eliminatePlayer } from "@/game/gameLogic";
import { getTopicForTheme } from "@/game/episodeThemes";
import { generateAITheme } from "@/game/aiTheme";
import { loadGameState, saveGameState, clearGameState } from "@/game/storage";
import { colors, radius, space } from "@/theme/tokens";

const DISCUSSION_SECONDS = 180;

export default function Game() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [suspected, setSuspected] = useState<number[]>([]);
  const [skipExile, setSkipExile] = useState(false);
  const [selectedNight, setSelectedNight] = useState<number | null>(null);
  const [time, setTime] = useState(DISCUSSION_SECONDS);
  const [timerOn, setTimerOn] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadGameState();
      if (!saved) return router.replace("/");
      if (!saved.currentTopic && saved.currentPhase === "episodeAnnouncement") {
        saved.currentTopic = getTopicForTheme(saved.selectedTheme);
        await saveGameState(saved);
      }
      if (saved.currentPhase === "discussion") setTimerOn(true);
      setState(saved);
    })();
  }, []);

  useEffect(() => {
    if (!timerOn || !state || state.currentPhase !== "discussion") return;
    const id = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          setTimerOn(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerOn, state]);

  const update = async (next: GameState) => {
    setState(next);
    await saveGameState(next);
  };

  if (!state) return <Screen>{null}</Screen>;
  const alive = state.players.filter((p) => p.isAlive);

  const transition = () => {
    const next: GameState = { ...state };
    switch (state.currentPhase) {
      case "episodeAnnouncement":
        next.currentPhase = "episodeTime";
        break;
      case "episodeTime":
        next.currentPhase = "discussion";
        setTime(DISCUSSION_SECONDS);
        setTimerOn(true);
        break;
      case "discussion":
        next.currentPhase = "voting";
        setSuspected([]);
        setSkipExile(false);
        setTimerOn(false);
        break;
      case "voting": {
        if (skipExile) {
          next.eliminatedTonight = null;
        } else {
          const counts: Record<number, number> = {};
          suspected.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
          let max = 0;
          let elim: number | null = null;
          Object.entries(counts).forEach(([id, c]) => {
            if (c > max) {
              max = c;
              elim = parseInt(id);
            }
          });
          if (elim !== null) {
            next.players = eliminatePlayer(next.players, elim);
            next.eliminatedTonight = elim;
          }
        }
        next.currentPhase = "voteResult";
        haptics.warning();
        break;
      }
      case "voteResult": {
        const winner = checkGameOver(next.players);
        if (winner) {
          next.winner = winner;
          next.currentPhase = "gameOver";
          haptics.success();
        } else {
          next.currentDay += 1;
          next.currentTopic = getTopicForTheme(next.selectedTheme);
          next.currentPhase = "episodeAnnouncement";
        }
        next.eliminatedTonight = null;
        break;
      }
    }
    update(next);
  };

  const toggleSuspect = (id: number) => {
    haptics.select();
    setSuspected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const changeTopic = () => update({ ...state, currentTopic: getTopicForTheme(state.selectedTheme) });

  const genAI = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const topic = await generateAITheme(state.selectedTheme, aiPrompt || undefined);
      await update({ ...state, currentTopic: topic });
      setAiPrompt("");
    } catch (e) {
      console.error("AI theme generation failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const restart = async () => {
    await clearGameState();
    router.replace("/");
  };

  const topic = state.currentTopic;

  return (
    <Screen scroll={false} background={colors.ink50} avoidKeyboard>
      <Header
        variant="bar"
        icon="wolf"
        title="エピソード人狼"
        subtitle={`${alive.length}人生存`}
        right={
          <View style={styles.headerRight}>
            <View style={styles.dayPill}>
              <Text style={styles.dayText}>Day{state.currentDay}</Text>
            </View>
            <GameMenu mode="normal" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {/* ゲームオーバー */}
        {state.currentPhase === "gameOver" && (
          <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
            <Card style={{ alignItems: "center", paddingVertical: 36 }}>
              <Icon name={state.winner === "人狼" ? "wolf" : "players"} size={64} color={state.winner === "人狼" ? colors.wolf : colors.villager} />
              <Text style={styles.bigWin}>{state.winner}の勝利！</Text>
              <Text style={styles.winSub}>
                {state.winner === "人狼" ? "人狼が村を支配しました" : "村人が人狼を追放しました"}
              </Text>
            </Card>

            <Card elevation="card">
              <Text style={styles.resultHead}>プレイヤー結果</Text>
              <View style={{ gap: space.sm }}>
                {state.players.map((p) => {
                  const wolf = p.role === "人狼";
                  return (
                    <View
                      key={p.id}
                      style={[styles.resultRow, { backgroundColor: wolf ? colors.wolfSurface : colors.villagerSurface, borderColor: wolf ? colors.wolfBorder : colors.villagerBorder }]}
                    >
                      <View style={styles.resultLeft}>
                        <Icon name={wolf ? "wolf" : "villager"} size={24} color={wolf ? colors.wolf : colors.villager} />
                        <View>
                          <Text style={styles.resultName}>{p.name}</Text>
                          <Text style={styles.resultRole}>{p.role}</Text>
                        </View>
                      </View>
                      {!p.isAlive && <Icon name="skull" size={20} color={colors.ink400} />}
                    </View>
                  );
                })}
              </View>
            </Card>

            <AppButton label="新しいゲームを始める" icon="home" onPress={restart} />
          </Animated.View>
        )}

        {/* エピソード発表 */}
        {state.currentPhase === "episodeAnnouncement" && (
          <Animated.View entering={FadeInDown} style={{ gap: space.lg }}>
            <PhaseBanner icon="day" title={`Day${state.currentDay}`} subtitle="エピソードテーマ発表">
              {state.eliminatedTonight !== null && (
                <InfoNote tone="danger">
                  {state.players[state.eliminatedTonight].name}さんが人狼に襲われました
                </InfoNote>
              )}
              <View style={styles.themeBox}>
                <View style={styles.themeTag}>
                  <Text style={styles.themeTagText}>TODAY'S THEME</Text>
                </View>
                <Text style={styles.themeCategory}>{topic?.category}</Text>
                <Text style={styles.themeTopic}>「{topic?.topic}」</Text>
              </View>
            </PhaseBanner>

            <InfoNote>このテーマでエピソードを話そう{"\n"}人狼=嘘 / 村人=真実</InfoNote>

            <View style={styles.rowGap}>
              <AppButton style={{ flex: 1 }} size="sm" variant="secondary" icon="refresh" label="テーマを変える" onPress={changeTopic} />
              <AppButton style={{ flex: 1 }} size="sm" variant="ai" icon="theme" label="AIで生成" onPress={() => setShowAI(!showAI)} />
            </View>

            {showAI && (
              <Card style={{ gap: space.md }} elevation="card">
                <TextInput
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder="例: 食べ物に関するテーマ、もっと面白く"
                  placeholderTextColor={colors.ink400}
                  style={styles.aiInput}
                />
                <AppButton size="sm" loading={generating} icon="theme" label={generating ? "生成中..." : "AIで生成"} onPress={genAI} />
              </Card>
            )}

            <AppButton variant="outline" icon="rules" label="エピソードタイムへ" onPress={transition} />
          </Animated.View>
        )}

        {/* エピソードタイム */}
        {state.currentPhase === "episodeTime" && (
          <Animated.View entering={FadeInDown} style={{ gap: space.lg }}>
            <PhaseBanner icon="rules" title="エピソードタイム" subtitle="EPISODE TIME">
              <ThemeMini category={topic?.category} topic={topic?.topic} />
            </PhaseBanner>
            <InfoNote>順番は自由！それぞれエピソードを話してください{"\n"}人狼=嘘のエピソード / 村人=本当のエピソード</InfoNote>
            <AppButton variant="outline" icon="discussion" label="議論フェーズへ" onPress={transition} />
          </Animated.View>
        )}

        {/* 議論 */}
        {state.currentPhase === "discussion" && (
          <Animated.View entering={FadeInDown} style={{ gap: space.lg }}>
            <PhaseBanner
              icon="discussion"
              title="議論タイム"
              subtitle="DISCUSSION"
              trailing={
                <View style={styles.timer}>
                  <Text style={[styles.timerText, { color: time <= 30 ? colors.wolf : colors.ink800 }]}>{formatTime(time)}</Text>
                </View>
              }
            >
              <ThemeMini category={topic?.category} topic={topic?.topic} />
            </PhaseBanner>
            <InfoNote>タイマー終了後、みんなで一斉に発表{"\n"}誰が人狼か推理してください</InfoNote>
            <AppButton variant="outline" icon="vote" label="投票フェーズへ" onPress={transition} />
          </Animated.View>
        )}

        {/* 投票 */}
        {state.currentPhase === "voting" && (
          <Animated.View entering={FadeInDown} style={{ gap: space.lg }}>
            <PhaseBanner icon="vote" title="投票タイム" subtitle="VOTING" />
            <InfoNote>人狼だと疑われたプレイヤーを選択{"\n"}複数選択可能</InfoNote>

            <Card elevation="card">
              <Text style={styles.cardLabel}>疑われているプレイヤー</Text>
              <View style={styles.grid2}>
                {alive.map((p) => (
                  <SelectChip
                    key={p.id}
                    label={p.name}
                    active={suspected.includes(p.id)}
                    onPress={() => {
                      if (skipExile) setSkipExile(false);
                      toggleSuspect(p.id);
                    }}
                  />
                ))}
              </View>
            </Card>

            <Card elevation="card">
              <PressableScale
                onPress={() => {
                  setSkipExile(!skipExile);
                  if (!skipExile) setSuspected([]);
                }}
                style={[styles.skipBtn, { backgroundColor: skipExile ? colors.ink700 : colors.ink100 }]}
              >
                <Icon name="handshake" size={20} color={skipExile ? colors.white : colors.ink700} />
                <Text style={[styles.skipText, { color: skipExile ? colors.white : colors.ink700 }]}>今回は追放しない</Text>
              </PressableScale>
            </Card>

            <AppButton label="投票結果を確定" disabled={!skipExile && suspected.length === 0} onPress={transition} />
          </Animated.View>
        )}

        {/* 投票結果 */}
        {state.currentPhase === "voteResult" && (
          <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
            <Card style={{ alignItems: "center", paddingVertical: 36 }}>
              <Icon name="balance" size={56} color={colors.ink700} />
              <Text style={styles.resultBig}>投票結果</Text>
              {state.eliminatedTonight !== null ? (
                <View style={[styles.voteOutcome, { backgroundColor: colors.wolfSurface, borderColor: colors.wolfBorder }]}>
                  <Text style={styles.elimName}>{state.players[state.eliminatedTonight].name}</Text>
                  <Text style={styles.elimSub}>が追放されました</Text>
                  <Icon name={state.players[state.eliminatedTonight].role === "人狼" ? "wolf" : "villager"} size={44} color={state.players[state.eliminatedTonight].role === "人狼" ? colors.wolf : colors.villager} />
                  <Text style={styles.elimRole}>{state.players[state.eliminatedTonight].role}</Text>
                </View>
              ) : (
                <View style={[styles.voteOutcome, { backgroundColor: colors.ink50, borderColor: colors.ink300 }]}>
                  <Text style={styles.elimName}>誰も追放されませんでした</Text>
                  <Text style={styles.elimSub}>今回は様子を見ることにしました</Text>
                  <Icon name="handshake" size={44} color={colors.ink500} />
                </View>
              )}
            </Card>
            <AppButton label="次へ進む" icon="forward" iconTrailing onPress={transition} />
          </Animated.View>
        )}

        {/* プレイヤーステータス */}
        {state.currentPhase !== "gameOver" && (
          <Card elevation="card" style={{ marginTop: space.lg }}>
            <View style={styles.statusHead}>
              <Icon name="players" size={20} color={colors.ink700} />
              <Text style={styles.cardLabel}>プレイヤー（{alive.length}人生存）</Text>
            </View>
            <View style={styles.grid2}>
              {state.players.map((p) => (
                <View key={p.id} style={[styles.statusChip, !p.isAlive && { opacity: 0.5 }]}>
                  <Text style={styles.statusName} numberOfLines={1}>{p.name}</Text>
                  {!p.isAlive && <Icon name="skull" size={16} color={colors.ink400} />}
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function PhaseBanner({
  icon,
  title,
  subtitle,
  trailing,
  children,
}: {
  icon: any;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerHead}>
        <IconBadge icon={icon} box={48} size={26} bg="rgba(255,255,255,0.2)" color={colors.white} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{title}</Text>
          <Text style={styles.bannerSub}>{subtitle}</Text>
        </View>
        {trailing}
      </View>
      {children}
    </View>
  );
}

function ThemeMini({ category, topic }: { category?: string; topic?: string }) {
  return (
    <View style={styles.themeMini}>
      <Text style={styles.themeMiniLabel}>THEME</Text>
      <Text style={styles.themeMiniCat}>{category}</Text>
      <Text style={styles.themeMiniTopic}>「{topic}」</Text>
    </View>
  );
}

function SelectChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale
      haptic={false}
      onPress={onPress}
      style={[styles.selectChip, { backgroundColor: active ? colors.ink900 : colors.ink100 }]}
    >
      <Text style={[styles.selectChipText, { color: active ? colors.white : colors.ink700 }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: "row", alignItems: "center", gap: space.md },
  dayPill: { backgroundColor: colors.ink900, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  dayText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  content: { padding: space.xl, paddingBottom: space["3xl"] },

  banner: { backgroundColor: colors.ink900, borderRadius: radius["2xl"], padding: space.xl, gap: space.md },
  bannerHead: { flexDirection: "row", alignItems: "center", gap: space.md },
  bannerTitle: { fontSize: 18, fontWeight: "800", color: colors.white },
  bannerSub: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.85)", letterSpacing: 1 },
  timer: { backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.lg },
  timerText: { fontSize: 20, fontWeight: "800" },

  themeBox: { backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, alignItems: "center" },
  themeTag: { backgroundColor: colors.ink900, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: space.sm },
  themeTagText: { color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  themeCategory: { fontSize: 17, fontWeight: "800", color: colors.ink800, marginBottom: 4 },
  themeTopic: { fontSize: 15, fontWeight: "700", color: colors.ink700, textAlign: "center" },

  themeMini: { backgroundColor: colors.white, borderRadius: radius.xl, padding: space.lg },
  themeMiniLabel: { fontSize: 11, fontWeight: "700", color: colors.ink500, marginBottom: 2 },
  themeMiniCat: { fontSize: 16, fontWeight: "800", color: colors.ink800 },
  themeMiniTopic: { fontSize: 14, fontWeight: "700", color: colors.ink700 },

  rowGap: { flexDirection: "row", gap: space.sm },
  aiInput: { height: 44, borderRadius: radius.md, borderWidth: 2, borderColor: colors.ink200, backgroundColor: colors.ink50, paddingHorizontal: 12, fontSize: 14, fontWeight: "500", color: colors.ink900 },

  bigWin: { fontSize: 24, fontWeight: "800", color: colors.ink800, marginTop: space.md },
  winSub: { fontSize: 14, fontWeight: "500", color: colors.ink600, marginTop: 4 },
  resultHead: { fontSize: 16, fontWeight: "800", color: colors.ink800, textAlign: "center", marginBottom: space.lg },
  resultRow: { padding: space.lg, borderRadius: radius.md, borderWidth: 2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultLeft: { flexDirection: "row", alignItems: "center", gap: space.md },
  resultName: { fontSize: 15, fontWeight: "700", color: colors.ink800 },
  resultRole: { fontSize: 12, fontWeight: "500", color: colors.ink500 },

  cardLabel: { fontSize: 14, fontWeight: "800", color: colors.ink800, marginBottom: space.md },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  selectChip: { flexGrow: 1, flexBasis: "47%", height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  selectChipText: { fontSize: 14, fontWeight: "700" },
  skipBtn: { height: 48, borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  skipText: { fontSize: 14, fontWeight: "700" },

  resultBig: { fontSize: 22, fontWeight: "800", color: colors.ink800, marginVertical: space.md },
  voteOutcome: { width: "100%", borderRadius: radius.xl, borderWidth: 2, padding: space.xl, alignItems: "center", gap: space.sm },
  elimName: { fontSize: 22, fontWeight: "800", color: colors.ink800 },
  elimSub: { fontSize: 15, fontWeight: "700", color: colors.ink600 },
  elimRole: { fontSize: 18, fontWeight: "700", color: colors.ink700 },

  statusHead: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md },
  statusChip: { flexGrow: 1, flexBasis: "47%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.ink100, borderWidth: 1, borderColor: colors.ink200, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  statusName: { fontSize: 13, fontWeight: "700", color: colors.ink800, flexShrink: 1 },
});
