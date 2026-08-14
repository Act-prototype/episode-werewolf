import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { ThemePicker } from "@/components/ThemePicker";
import { NameInputList, defaultPlayerName } from "@/components/NameInputList";
import { GameMenu } from "@/components/GameMenu";
import { SketchButton } from "@/components/sketch/SketchButton";
import { SketchDivider } from "@/components/sketch/SketchDivider";
import { SketchFrame } from "@/components/sketch/SketchFrame";
import { SketchStepper } from "@/components/sketch/SketchStepper";
import { episodeThemes } from "@/game/episodeThemes";
import { saveGameState, saveNormalSetup, loadNormalSetup } from "@/game/storage";
import { GameState } from "@/game/types";
import { colors, space, type } from "@/theme/tokens";

const MAX_PLAYERS = 20;
const MIN_PLAYERS = 3;
/** 村人は最低2人残す（1人だと議論が成立しない） */
const MIN_VILLAGERS = 2;

export default function Setup() {
  const router = useRouter();
  // 「プレイヤー」は参加者の総数。人狼はその内数（村人 = プレイヤー - 人狼）。
  const [playerCount, setPlayerCount] = useState(5);
  const [werewolfCount, setWerewolfCount] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(episodeThemes[0].category);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: 5 }, (_, i) => defaultPlayerName(i))
  );
  // 前回の設定を読み終わるまで待つ。既定値を一瞬見せてから差し替わるのを避ける
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadNormalSetup();
      if (saved) {
        setPlayerCount(saved.playerCount);
        setWerewolfCount(saved.werewolfCount);
        setSelectedTheme(saved.selectedTheme);
        setNames(saved.names);
      }
      setReady(true);
    })();
  }, []);

  /** 人数が変わったら名前欄の数を合わせる（入力済みの名前は保持） */
  const resizeNames = (total: number) =>
    setNames((prev) => Array.from({ length: total }, (_, i) => prev[i] || defaultPlayerName(i)));

  const updatePlayers = (next: number) => {
    setPlayerCount(next);
    resizeNames(next);
    // 人数を減らして村人が2人を切る場合は人狼も詰める
    setWerewolfCount((w) => Math.min(w, Math.max(1, next - MIN_VILLAGERS)));
  };

  const handleName = (index: number, name: string) =>
    setNames((prev) => prev.map((n, i) => (i === index ? name : n)));

  const handleStart = async () => {
    // ゲーム終了後にこの画面へ戻ったとき、同じ顔ぶれで続けられるよう設定を残す
    await saveNormalSetup({ playerCount, werewolfCount, selectedTheme, names });

    const state: GameState = {
      // 名前欄の数ではなくプレイヤー数を人数の正とする
      players: Array.from({ length: playerCount }, (_, i) => ({
        id: i,
        name: names[i] || defaultPlayerName(i),
        role: null,
        isAlive: true,
        hasSeenRole: false,
        votes: 0,
      })),
      werewolfCount,
      selectedTheme,
      currentPhase: "roleReveal",
      currentDay: 1,
      currentTopic: null,
      eliminatedTonight: null,
      votingResults: {},
      winner: null,
    };
    await saveGameState(state);
    router.push("/role-reveal");
  };

  if (!ready) return <Screen>{null}</Screen>;

  return (
    <Screen scroll={false} edges={{ top: true, bottom: true }} avoidKeyboard>
      <View style={styles.menu}>
        <GameMenu mode="normal" />
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
          <SketchStepper
            label="人狼"
            value={werewolfCount}
            min={1}
            max={Math.max(1, playerCount - MIN_VILLAGERS)}
            onChange={setWerewolfCount}
          />
        </SketchFrame>

        <SketchFrame style={styles.section} contentStyle={styles.group}>
          <SectionTitle label="エピソードテーマ" ruleWidth={161} />
          <ThemePicker selected={selectedTheme} onSelect={setSelectedTheme} />
        </SketchFrame>

        <SketchFrame style={styles.section} contentStyle={styles.group}>
          <SectionTitle label="プレイヤー名" ruleWidth={116} />
          <NameInputList names={names} onChange={handleName} />
        </SketchFrame>

        <SketchButton label="設定おわり" onPress={handleStart} style={styles.start} />
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

  section: {},
  steppers: { paddingVertical: space.md, gap: space.xl },
  group: { paddingVertical: space.md, gap: space.lg },

  sectionTitle: { alignItems: "center", gap: space.xs },
  sectionLabel: { ...type.h2, color: colors.ink },

  start: { marginTop: space.md },
});
