import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Header } from "@/components/Header";
import { SectionCard, Pill } from "@/components/SectionCard";
import { Stepper } from "@/components/Stepper";
import { ThemePicker } from "@/components/ThemePicker";
import { NameInputList } from "@/components/NameInputList";
import { BottomBar } from "@/components/BottomBar";
import { AppButton } from "@/components/AppButton";
import { GameMenu } from "@/components/GameMenu";
import { episodeThemes } from "@/game/episodeThemes";
import { saveGameState } from "@/game/storage";
import { GameState } from "@/game/types";
import { colors, space } from "@/theme/tokens";

export default function Setup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(5);
  const [werewolfCount, setWerewolfCount] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(episodeThemes[0].category);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: 5 }, (_, i) => `プレイヤー${i + 1}`)
  );

  const updatePlayerCount = (next: number) => {
    if (next < 3) return;
    setPlayerCount(next);
    setNames((prev) => Array.from({ length: next }, (_, i) => prev[i] || `プレイヤー${i + 1}`));
    if (werewolfCount >= next - 1) setWerewolfCount(Math.max(1, Math.floor(next / 3)));
  };

  const handleName = (index: number, name: string) =>
    setNames((prev) => prev.map((n, i) => (i === index ? name : n)));

  const handleStart = async () => {
    const state: GameState = {
      players: names.map((name, i) => ({
        id: i,
        name,
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

  return (
    <Screen scroll={false} edges={{ top: false, bottom: false }}>
      <Header
        icon="players"
        title="通常モード"
        subtitle="NORMAL MODE"
        onBack={() => router.replace("/")}
        right={<GameMenu mode="normal" showRules={false} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionCard icon="players" title="プレイヤー数" pill={<Pill>3人〜</Pill>}>
          <Stepper value={playerCount} min={3} onChange={updatePlayerCount} />
        </SectionCard>

        <SectionCard
          icon="wolf"
          title="人狼の数"
          pill={<Pill icon="villager">村人 {playerCount - werewolfCount}人</Pill>}
        >
          <Stepper value={werewolfCount} min={1} max={playerCount - 2} onChange={setWerewolfCount} />
        </SectionCard>

        <SectionCard icon="theme" title="エピソードテーマ">
          <ThemePicker selected={selectedTheme} onSelect={setSelectedTheme} />
        </SectionCard>

        <SectionCard icon="players" title="プレイヤー名">
          <NameInputList names={names} onChange={handleName} />
        </SectionCard>
      </ScrollView>

      <BottomBar>
        <AppButton label="ゲームスタート" icon="play" iconTrailing onPress={handleStart} />
      </BottomBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.lg, backgroundColor: colors.ink50 },
});
