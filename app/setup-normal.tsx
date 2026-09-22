import { useEffect, useRef, useState } from "react";
import { Alert, View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { SetupThemeSelection } from "@/components/SetupThemeSelection";
import { SketchBox } from "@/components/sketch/SketchBox";
import { NameInputList, defaultPlayerName } from "@/components/NameInputList";
import { GameMenu } from "@/components/GameMenu";
import { SketchButton } from "@/components/sketch/SketchButton";
import { SketchDivider } from "@/components/sketch/SketchDivider";
import { SketchFrame } from "@/components/sketch/SketchFrame";
import { SketchStepper } from "@/components/sketch/SketchStepper";
import { useTopicStore } from "@/game/TopicStore";
import { episodeThemes, getRandomTopic, SHUFFLE_THEME } from "@/game/episodeThemes";
import { saveGameState, saveNormalSetup, loadNormalSetup, loadGameState } from "@/game/storage";
import { createNormalGame } from "@/game/gameLogic";
import { colors, space, type } from "@/theme/tokens";

const MAX_PLAYERS = 20;
const MIN_PLAYERS = 3;

export default function Setup() {
  const router = useRouter();
  const [loadingError, setLoadingError] = useState(false);
  const store = useTopicStore();
  // 「プレイヤー」は参加者の総数。人狼はその内数（村人 = プレイヤー - 人狼）。
  const [playerCount, setPlayerCount] = useState(5);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [choosingTheme, setChoosingTheme] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(episodeThemes[0].category);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: 5 }, (_, i) => defaultPlayerName(i))
  );
  // 前回の設定を読み終わるまで待つ。既定値を一瞬見せてから差し替わるのを避ける
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!store.ready) return;
    (async () => {
      try {
        const ongoing = await loadGameState();
        if (ongoing) {
          router.replace(ongoing.currentPhase === "sessionSummary" ? "/normal-summary" : ongoing.currentPhase === "roleReveal" ? "/role-reveal" : "/game");
          return;
        }
        const saved = await loadNormalSetup();
        if (saved) {
          setPlayerCount(saved.playerCount);
          setNames(saved.names);
        }
        setSelectedTheme(getRandomTopic(store.availableCategories).category);
        setReady(true);
      } catch { setLoadingError(true); }
    })();
  }, [store.ready]);

  /** 人数が変わったら名前欄の数を合わせる（入力済みの名前は保持） */
  const resizeNames = (total: number) =>
    setNames((prev) => Array.from({ length: total }, (_, i) => prev[i] || defaultPlayerName(i)));

  const updatePlayers = (next: number) => {
    setPlayerCount(next);
    resizeNames(next);
  };

  const handleName = (index: number, name: string) =>
    setNames((prev) => prev.map((n, i) => (i === index ? name : n)));

  const handleStart = async () => {
    if (!store.ready || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const ongoing = await loadGameState();
      if (ongoing) {
        router.replace(ongoing.currentPhase === "sessionSummary" ? "/normal-summary" : ongoing.currentPhase === "roleReveal" ? "/role-reveal" : "/game");
        return;
      }
      const theme = selectedTheme === SHUFFLE_THEME || store.availableCategories.includes(selectedTheme) ? selectedTheme : episodeThemes[0].category;
      await saveNormalSetup({ playerCount, werewolfCount: 1, selectedTheme: theme, names });
      const state = createNormalGame({
        playerNames: Array.from({ length: playerCount }, (_, i) => names[i] || defaultPlayerName(i)),
        selectedTheme: theme,
      });
      await saveGameState(state);
      router.push("/role-reveal");
    } catch {
      Alert.alert("保存できませんでした", "もう一度お試しください。");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (!ready) return <Screen>{loadingError && <View style={{ padding: space.xl, gap: space.lg }}>
    <Text style={{ ...type.body, color: colors.ink }}>保存したゲームを読み込めませんでした。</Text>
    <SketchButton label="ホームへ" onPress={() => router.replace("/mode-select")} />
  </View>}</Screen>;

  if (choosingTheme) return <SetupThemeSelection selected={selectedTheme}
    onSelect={(category) => { setSelectedTheme(category); setChoosingTheme(false); }}
    onBack={() => setChoosingTheme(false)} />;

  return (
    <Screen scroll={false} edges={{ top: true, bottom: true }} avoidKeyboard>
      <View style={styles.menu}>
        <GameMenu mode="normal" disabled={saving} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.heading}>SETTING</Text>

        {/* 参加人数と人狼の数。上下のアーチで1つの囲みにする */}
        <SketchFrame style={styles.section} contentStyle={styles.steppers}>
          <SketchStepper
            label="プレイヤー"
            value={playerCount}
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            onChange={updatePlayers}
          />
          <Text style={styles.ruleNote}>人狼は1人。全員で投票。{"\n"}負けるたびグラスが1杯。少ない人ほど上位。</Text>
        </SketchFrame>

        <SketchFrame style={styles.section} contentStyle={styles.group}>
          <SectionTitle label="エピソードテーマ" ruleWidth={161} />
          <View style={styles.themeChoice}>
            <SketchBox contentStyle={styles.themeBox}>
              <Text style={styles.themeName}>{selectedTheme === SHUFFLE_THEME ? "ランダム" : selectedTheme}</Text>
            </SketchBox>
            <SketchButton label="テーマを変える" variant="blue" height={48} onPress={() => setChoosingTheme(true)} />
          </View>
        </SketchFrame>

        <SketchFrame style={styles.section} contentStyle={styles.group}>
          <SectionTitle label="プレイヤー名" ruleWidth={116} />
          <NameInputList names={names} onChange={handleName} />
        </SketchFrame>

        <SketchButton label="設定おわり" disabled={!store.ready || saving} onPress={handleStart} style={styles.start} />
      </ScrollView>
    </Screen>
  );
}

/** セクション見出し + 直下の手書き罫線 */
function SectionTitle({ label, ruleWidth }: { label: string; ruleWidth: number }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <SketchDivider weight="medium" width={ruleWidth} height={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  menu: { position: "absolute", top: space.sm, right: space.xl, zIndex: 2 },
  content: { paddingHorizontal: space.xl, paddingBottom: space["3xl"], gap: space["2xl"] },

  heading: { ...type.display, color: colors.ink, textAlign: "center", marginTop: space["2xl"] },

  themeChoice: { width: "100%", maxWidth: 278, alignSelf: "center", gap: space.sm },
  themeBox: { alignItems: "center" },
  themeName: { ...type.title, color: colors.ink, textAlign: "center" },
  section: {},
  steppers: { paddingVertical: space.md, gap: space.xl },
  group: { paddingVertical: space.md, gap: space.lg },

  sectionTitle: { alignItems: "center", gap: space.xs },
  sectionLabel: { ...type.h2, color: colors.ink },

  ruleNote: { ...type.small, color: colors.inkSub, textAlign: "center" },
  start: { marginTop: space.md },
});
