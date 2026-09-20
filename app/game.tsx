import { useEffect, useRef, useState } from "react";
import { Alert, View, Text, Image, ScrollView, StyleSheet } from "react-native";
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
import { ThemeFrame } from "@/components/sketch/ThemeFrame";
import { SketchOptionRow } from "@/components/sketch/SketchOptionRow";
import { GameThemeControls } from "@/components/GameThemeControls";
import { useTopicStore } from "@/game/TopicStore";
import { haptics } from "@/components/haptics";
import { GameState, Player } from "@/game/types";
import { createNormalGame, resolveNormalRound } from "@/game/gameLogic";
import { getTopicForTheme, CUSTOM_THEME } from "@/game/episodeThemes";
import { discussionQuote, episodeQuote } from "@/game/quotes";
import { loadGameState, saveGameState, clearGameState } from "@/game/storage";
import { sketch } from "@/theme/sketchAssets";
import { colors, space, type } from "@/theme/tokens";

const DISCUSSION_SECONDS = 180;
/** 議論時間の上限。±ボタンで1分ずつ足し引きできる */
const MAX_DISCUSSION_SECONDS = 30 * 60;

export default function Game() {
  const router = useRouter();
  const { ready: libraryReady, availableCategories } = useTopicStore();
  const [state, setState] = useState<GameState | null>(null);
  const [vote, setVote] = useState<number | "tie" | null>(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [time, setTime] = useState(DISCUSSION_SECONDS);
  const [timerOn, setTimerOn] = useState(false);

  useEffect(() => {
    if (!libraryReady) return;
    (async () => {
      const saved = await loadGameState();
      if (!saved) return router.replace("/mode-select");
      if (saved.currentPhase === "roleReveal") return router.replace("/role-reveal");
      if (saved.currentPhase === "episodeAnnouncement") {
        const isAvailable = availableCategories.includes(saved.currentTopic?.category ?? "") || saved.currentTopic?.category === CUSTOM_THEME;
        if (!saved.currentTopic || !isAvailable) {
          saved.currentTopic = getTopicForTheme(saved.selectedTheme, availableCategories, saved.customTopic);
          await saveGameState(saved);
        }
      }
      if (saved.currentPhase === "discussion") setTimerOn(true);
      setState(saved);
    })();
  }, [libraryReady]);

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
  }, [timerOn, state?.currentPhase]);

  const persist = async (next: GameState, destination?: "/role-reveal" | "/setup-normal") => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await saveGameState(next);
      if (destination) router.replace(destination);
      else {
        if (next.currentPhase === "discussion" && state?.currentPhase !== "discussion") {
          setTime(DISCUSSION_SECONDS);
          setTimerOn(true);
        } else if (next.currentPhase !== "discussion") {
          setTimerOn(false);
        }
        setState(next);
      }
    } catch {
      Alert.alert("保存できませんでした", "もう一度お試しください。");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!state) return <Screen>{null}</Screen>;

  const transition = () => {
    if (savingRef.current) return;
    switch (state.currentPhase) {
      case "episodeAnnouncement":
        void persist({ ...state, currentPhase: "episodeTime" });
        break;
      case "episodeTime":
        void persist({ ...state, currentPhase: "discussion" });
        break;
      case "discussion":
        setVote(null);
        void persist({ ...state, currentPhase: "voting" });
        break;
      case "voting":
        if (vote === null) return;
        void persist(resolveNormalRound(state, vote === "tie" ? null : vote));
        haptics.reveal();
        break;
    }
  };

  const changeTopic = () =>
    void persist({ ...state, currentTopic: getTopicForTheme(state.selectedTheme, availableCategories, state.customTopic) });

  const replay = () => {
    const next = createNormalGame({ playerNames: state.players.map((player) => player.name), selectedTheme: state.selectedTheme, customTopic: state.customTopic });
    void persist(next, "/role-reveal");
  };

  const changeSetup = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await clearGameState();
      router.replace("/setup-normal");
    } catch {
      Alert.alert("保存できませんでした", "もう一度お試しください。");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const topic = state.currentTopic;
  const accused = state.players.find((player) => player.id === state.accusedPlayerId);
  const wolf = state.players.find((player) => player.role === "人狼");

  // 勝敗発表の2グループ。役職未割当(null)はどちらにも入れない
  const winners = state.players.filter((p) => p.role !== null && p.role === state.winner);
  const losers = state.players.filter((p) => p.role !== null && p.role !== state.winner);

  return (
    <Screen scroll={false} edges={{ top: false, bottom: true }} avoidKeyboard>
      <GameHeader />

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
            <Text style={styles.phaseLead}>全員で話して、1回の投票で決着。</Text>

            <ThemeFrame category={topic?.category} topic={topic?.topic} withCat />

            <GameThemeControls selected={state.selectedTheme} customTopic={state.customTopic} onShuffle={changeTopic}
              onChange={(category, customTopic, purchasedCategories) => void persist({ ...state, selectedTheme: category, customTopic, currentTopic: getTopicForTheme(category, purchasedCategories ?? availableCategories, customTopic) })} />

            <View style={styles.roster}>
              {state.players.map((p) => (
                <View key={p.id} style={styles.rosterItem}>
                  <Text style={styles.rosterName}>{p.name}</Text>
                  <SketchDivider weight="fine" width={130} height={3} />
                </View>
              ))}
            </View>

            <SketchButton label="自分語りタイムへ" onPress={transition} disabled={saving} style={styles.cta} />
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

            <SketchButton label="犯人探しタイムへ" onPress={transition} disabled={saving} style={styles.cta} />
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

            <SketchButton label="投票へ" onPress={transition} disabled={saving} style={styles.cta} />
          </Animated.View>
        )}

        {/* 一斉投票の結果を1台に入力する */}
        {state.currentPhase === "voting" && (
          <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
            <Text style={styles.phaseTitle}>投票タイム</Text>
            <Text style={styles.phaseLead}>全員で人狼だと思う人を一斉に指さそう。{"\n"}最も票が集まった1人を選んでね。</Text>
            <View style={styles.voteList}>
              {state.players.map((player) => (
                <SketchOptionRow key={player.id} label={player.name} selected={vote === player.id}
                  onPress={() => { if (!savingRef.current) setVote(player.id); }} />
              ))}
              <SketchOptionRow label="最多票が同票だった" selected={vote === "tie"}
                onPress={() => { if (!savingRef.current) setVote("tie"); }} />
            </View>
            <Text style={styles.phaseLead}>人狼を当てたら村人の勝ち。{"\n"}外れ・同票なら人狼の勝ち。</Text>
            <SketchButton label="結果発表へ" onPress={transition} disabled={saving || vote === null} style={styles.cta} />
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

            <Text style={styles.phaseLead}>{accused ? `投票で選ばれたのは ${accused.name}` : "最多票が同票になったため、人狼の勝ち"}</Text>
            <Text style={styles.phaseTitle}>人狼は {wolf?.name} でした</Text>

            {/* 勝者は上下の手書きアーチで囲う */}
            <SketchFrame style={styles.fullWidth} contentStyle={styles.winnerFrameInner}>
              <ResultGrid players={winners} />
            </SketchFrame>

            <Image source={sketch.resultMakeinu} style={styles.makeinuArt} resizeMode="contain" />
            <ResultGrid players={losers} />

            <Text style={styles.phaseLead}>うそだったのは、どんなところ？{"\n"}みんなで答え合わせしよう。</Text>
            <SketchButton label="同じメンバーでもう1回" onPress={replay} disabled={saving} style={styles.cta} />
            <PressableScale accessibilityRole="button" accessibilityLabel="設定を変える" onPress={changeSetup} disabled={saving}>
              <Text style={styles.phaseLead}>設定を変える</Text>
            </PressableScale>
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

  phaseTitle: { ...type.h2, color: colors.ink, textAlign: "center" },
  phaseLead: { ...type.small, color: colors.inkSub, textAlign: "center", lineHeight: 20 },

  // テーマ枠
  // お題が主役。2行に折り返せる大きさに抑えてある（任意作成は最長40文字）




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
