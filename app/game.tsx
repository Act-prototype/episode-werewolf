import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PressableScale } from "@/components/PressableScale";
import { GameHeader } from "@/components/sketch/GameHeader";
import { RoleArt } from "@/components/sketch/RoleArt";
import { SketchButton } from "@/components/sketch/SketchButton";
import { SketchClock } from "@/components/sketch/SketchClock";
import { SketchDivider } from "@/components/sketch/SketchDivider";
import { SketchFrame } from "@/components/sketch/SketchFrame";
import { SketchQuote } from "@/components/sketch/SketchQuote";
import { SketchStretch } from "@/components/sketch/SketchStretch";
import { ThemeFrame } from "@/components/sketch/ThemeFrame";
import { ThemePill } from "@/components/sketch/ThemePill";
import { SketchOptionRow } from "@/components/sketch/SketchOptionRow";
import { AiThemeBox } from "@/components/sketch/AiThemeBox";
import { haptics } from "@/components/haptics";
import { GameState, Player } from "@/game/types";
import { checkGameOver, eliminatePlayer } from "@/game/gameLogic";
import { getTopicForTheme } from "@/game/episodeThemes";
import { generateAITheme } from "@/game/aiTheme";
import { discussionQuote, episodeQuote, PEACEFUL_MORNING } from "@/game/quotes";
import { loadGameState, saveGameState, clearGameState } from "@/game/storage";
import { sketch } from "@/theme/sketchAssets";
import { colors, space, type } from "@/theme/tokens";

const DISCUSSION_SECONDS = 180;
/** 議論時間の上限。±ボタンで1分ずつ足し引きできる */
const MAX_DISCUSSION_SECONDS = 30 * 60;

export default function Game() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [suspected, setSuspected] = useState<number[]>([]);
  const [skipExile, setSkipExile] = useState(false);
  const [time, setTime] = useState(DISCUSSION_SECONDS);
  const [timerOn, setTimerOn] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadGameState();
      if (!saved) return router.replace("/mode-select");
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

  const changeTopic = () =>
    update({ ...state, currentTopic: getTopicForTheme(state.selectedTheme) });

  const genAI = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const generated = await generateAITheme({
        category: state.selectedTheme,
        // 「もっと面白く」のような相対的な指示に応えるため、今のお題も渡す
        currentTopic: state.currentTopic?.topic,
        customPrompt: aiPrompt || undefined,
      });
      await update({ ...state, currentTopic: generated });
      setAiPrompt("");
    } catch (e) {
      console.error("AI theme generation failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const restart = async () => {
    // 設定(normalSetup)は残す。同じ顔ぶれでもう1戦するのが普通なので、
    // トップではなく設定画面に戻して人数・名前・テーマを引き継ぐ。
    await clearGameState();
    router.replace("/setup-normal");
  };

  const topic = state.currentTopic;
  const eliminated =
    state.eliminatedTonight !== null ? state.players[state.eliminatedTonight] : null;

  // 勝敗発表の2グループ。役職未割当(null)はどちらにも入れない
  const winners = state.players.filter((p) => p.role !== null && p.role === state.winner);
  const losers = state.players.filter((p) => p.role !== null && p.role !== state.winner);

  return (
    <Screen scroll={false} edges={{ top: false, bottom: true }} avoidKeyboard>
      {/* 勝敗発表は「何日目」が意味を持たないので日付を出さない */}
      <GameHeader day={state.currentPhase === "gameOver" ? undefined : state.currentDay} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* テーマ発表 */}
        {state.currentPhase === "episodeAnnouncement" && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
            <Text style={styles.phaseTitle}>テーマ発表</Text>

            <ThemeFrame category={topic?.category} topic={topic?.topic} withCat />

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

            <View style={styles.roster}>
              {alive.map((p) => (
                <View key={p.id} style={styles.rosterItem}>
                  <Text style={styles.rosterName}>{p.name}</Text>
                  <SketchDivider weight="fine" width={130} height={3} />
                </View>
              ))}
            </View>

            <SketchButton label="自分語りタイムへ" onPress={transition} style={styles.cta} />
          </Animated.View>
        )}

        {/* 自分語りタイム */}
        {state.currentPhase === "episodeTime" && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
            <Text style={styles.phaseTitle}>自分語りタイム</Text>
            <Text style={styles.phaseLead}>順番は自由、それぞれのエピを語り合うのだ。</Text>

            <ThemeFrame category={topic?.category} topic={topic?.topic} />

            <Image source={sketch.artCampfire} style={styles.campfire} resizeMode="contain" />

            <SketchQuote quote={episodeQuote(state.currentDay)} />

            <SketchButton label="犯人探しタイムへ" onPress={transition} style={styles.cta} />
          </Animated.View>
        )}

        {/* 犯人探しタイム */}
        {state.currentPhase === "discussion" && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
            <Text style={styles.phaseTitle}>犯人探しタイム</Text>
            <Text style={styles.phaseLead}>人狼は誰だ。</Text>

            {/* 残り時間の左右で1分単位に足し引きする */}
            <View style={styles.timerBlock}>
              <View style={styles.timerRow}>
                <TimeStep
                  dir="minus"
                  disabled={time < 60}
                  onPress={() => setTime((t) => Math.max(0, t - 60))}
                />
                <Text style={[styles.timer, time <= 30 && { color: colors.wolf }]}>
                  {formatTime(time)}
                </Text>
                <TimeStep
                  dir="plus"
                  disabled={time >= MAX_DISCUSSION_SECONDS}
                  onPress={() => setTime((t) => Math.min(MAX_DISCUSSION_SECONDS, t + 60))}
                />
              </View>
              <SketchDivider weight="medium" width={170} height={4} />
            </View>

            {/* 針は1分で一周する。残り時間そのものではなく「時が流れている」表現 */}
            <SketchClock size={250} running={timerOn} secondsPerTurn={60} style={styles.clock} />

            <SketchQuote quote={discussionQuote(state.currentDay)} />

            <SketchButton label="投票へ" onPress={transition} style={styles.cta} />
          </Animated.View>
        )}

        {/* 裁きの時 */}
        {state.currentPhase === "voting" && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
            <View style={styles.titleWithRule}>
              <Text style={styles.phaseTitle}>裁きの時</Text>
              <SketchDivider weight="fine" width={110} height={3} />
            </View>
            <Text style={styles.phaseLead}>人狼だと思うプレイヤーを選べ{"\n"}複数選択可能</Text>

            <View style={styles.voteList}>
              {alive.map((p) => (
                <SketchOptionRow
                  key={p.id}
                  label={p.name}
                  selected={suspected.includes(p.id)}
                  onPress={() => {
                    if (skipExile) setSkipExile(false);
                    toggleSuspect(p.id);
                  }}
                />
              ))}
              <SketchOptionRow
                label="今回は誰も追放しない"
                selected={skipExile}
                onPress={() => {
                  setSkipExile(!skipExile);
                  if (!skipExile) setSuspected([]);
                }}
              />
            </View>

            <Text style={styles.phaseLead}>さあ、投票だ。</Text>

            <SketchButton
              label="結果発表へ"
              onPress={transition}
              disabled={!skipExile && suspected.length === 0}
              style={styles.cta}
            />
          </Animated.View>
        )}

        {/* 結果発表 */}
        {state.currentPhase === "voteResult" && (
          <Animated.View entering={FadeIn.duration(260)} style={[styles.stack, styles.fill]}>
            {eliminated ? (
              <>
                {/* 追放ありのときだけ「結果発表」の枠が出る（モック準拠） */}
                <View style={styles.resultLabel}>
                  <SketchStretch name="box" height={46} style={StyleSheet.absoluteFill} />
                  <Text style={styles.resultLabelText}>結果発表</Text>
                </View>

                <Text style={styles.elimName}>{eliminated.name}が追放....</Text>
                <RoleArt
                  role={eliminated.role === "人狼" ? "人狼" : "村人"}
                  size={210}
                  variant={eliminated.id}
                  style={styles.elimArt}
                />

                <View style={styles.spacer} />

                <Text style={styles.verdict}>
                  こいつは
                  <Text
                    style={{ color: eliminated.role === "人狼" ? colors.wolf : colors.villager }}
                  >
                    【{eliminated.role}】
                  </Text>
                  だった
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.morning}>{PEACEFUL_MORNING}</Text>
                <Image source={sketch.artDawnHill} style={styles.dawn} resizeMode="contain" />

                <View style={styles.spacer} />

                <Text style={styles.noVerdict}>昨夜は誰も裁かれなかった...</Text>
              </>
            )}

            <SketchButton label="次へ" onPress={transition} style={styles.cta} />
          </Animated.View>
        )}

        {/* 勝敗発表 */}
        {state.currentPhase === "gameOver" && (
          <Animated.View entering={FadeIn} style={styles.stack}>
            <Image
              source={state.winner === "人狼" ? sketch.resultWolfWin : sketch.resultVillagerWin}
              style={styles.verdictArt}
              resizeMode="contain"
            />

            {/* 勝者は上下の手書きアーチで囲う */}
            <SketchFrame style={styles.fullWidth} contentStyle={styles.winnerFrameInner}>
              <ResultGrid players={winners} />
            </SketchFrame>

            <Image source={sketch.resultMakeinu} style={styles.makeinuArt} resizeMode="contain" />
            <ResultGrid players={losers} />

            <SketchButton label="新しいゲームを始める" onPress={restart} style={styles.cta} />
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

/**
 * 勝敗発表の2列グリッド。役職イラストとプレイヤー名を並べる。
 *
 * イラストは役職ごとに縦横比が違う（チワワ0.69・ポメ0.99）ので、枠の寸法は
 * 揃えたうえで fill（contain）で内側に収める。横長の絵ほど小さく収まる。
 */
function ResultGrid({ players }: { players: Player[] }) {
  return (
    <View style={styles.resultGrid}>
      {players.map((p) => (
        <View key={p.id} style={styles.resultCard}>
          <View style={styles.resultCardBox}>
            {p.role && <RoleArt role={p.role} fill variant={p.id} />}
          </View>
          <Text style={styles.resultCardName} numberOfLines={1}>
            {p.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** 議論時間を1分単位で足し引きするボタン。手書きの＋／−素材を使う */
function TimeStep({
  dir,
  disabled,
  onPress,
}: {
  dir: "plus" | "minus";
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} haptic={false} style={styles.timeStep}>
      <Image
        source={dir === "plus" ? sketch.stepperPlus : sketch.stepperMinus}
        style={dir === "plus" ? styles.stepPlus : styles.stepMinus}
        resizeMode="contain"
      />
    </PressableScale>
  );
}

const formatTime = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

const styles = StyleSheet.create({
  // 結果発表は締めの一文とボタンを下に寄せるため、内容を画面高まで伸ばせるようにする
  content: { flexGrow: 1, paddingHorizontal: space.xl, paddingBottom: space["3xl"] },
  stack: { alignItems: "center", gap: space.lg, paddingTop: space.xl },
  fill: { flex: 1, width: "100%" },
  spacer: { flex: 1, minHeight: space.xl },

  phaseTitle: { ...type.h2, color: colors.ink, textAlign: "center" },
  phaseLead: { ...type.small, color: colors.inkSub, textAlign: "center", lineHeight: 20 },
  titleWithRule: { alignItems: "center", gap: space.xs },

  // テーマ枠
  // お題が主役。2行に折り返せる大きさに抑えてある（AI生成は最長15文字）


  pillRow: { flexDirection: "row", gap: space.md },


  // 参加者一覧（テーマ発表）
  roster: { alignItems: "center", gap: space.md, marginTop: space.sm },
  rosterItem: { alignItems: "center", gap: 2 },
  rosterName: { ...type.title, color: colors.ink },

  campfire: { width: 200, height: 100, marginVertical: space.lg },

  // 犯人探しタイム
  timerBlock: { alignItems: "center", gap: space.xs },
  timerRow: { flexDirection: "row", alignItems: "center", gap: space.lg },
  timer: { fontFamily: type.display.fontFamily, fontSize: 56, color: colors.ink },
  clock: { marginTop: space.sm },
  timeStep: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepMinus: { width: 24, height: 8 },
  stepPlus: { width: 20, height: 18 },

  // 結果発表
  resultLabel: {
    width: "100%",
    maxWidth: 330,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space["2xl"],
  },
  resultLabelText: { ...type.title, color: colors.ink },
  elimName: { ...type.title, color: colors.ink, marginTop: space["3xl"] },
  elimArt: { marginVertical: space.sm },
  verdict: { ...type.display, fontFamily: type.title.fontFamily, color: colors.ink, textAlign: "center" },
  // 追放なしの締め文はモックでは役職開示より小さい
  noVerdict: { ...type.title, color: colors.ink, textAlign: "center" },
  // 朝の情景だけ明朝で組む
  morning: { ...type.narration, color: colors.ink, textAlign: "center", lineHeight: 32, marginTop: space["4xl"] },
  dawn: { width: "100%", height: 110, marginTop: space["2xl"] },

  // 投票
  voteList: { width: "100%", gap: space.md, marginTop: space.sm },

  // 勝敗発表
  fullWidth: { width: "100%" },
  // 見出しは人狼(3.52)と村人(3.86)で縦横比が違うため、幅を揃えて高さは contain に委ねる
  verdictArt: { width: 280, height: 80 },
  // アーチ素材自体が余白を持つので内側の縦パディングは最小でよい
  winnerFrameInner: { paddingVertical: space.sm },
  makeinuArt: { width: 80, height: 29, marginTop: space.md },
  resultGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    // モック実測の間隔55ptに合わせる（トークンの40では詰まりすぎる）
    columnGap: 55,
    rowGap: space.xl,
  },
  // 34%は枠内側313ptに対し106pt。モック実測の107ptと一致する
  resultCard: { width: "34%", alignItems: "center", gap: space.md },
  // 枠はモック実測（107x132pt・線幅1.25pt）。手書き素材ではなく均一な細線
  resultCardBox: {
    width: "100%",
    aspectRatio: 107 / 132,
    borderWidth: 1.25,
    borderColor: colors.ink,
    padding: space.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCardName: { ...type.small, color: colors.ink, textAlign: "center" },

  cta: { width: "100%", maxWidth: 320, marginTop: space.xl },
});
