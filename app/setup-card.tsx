import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
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
import { saveCardState } from "@/game/storage";
import { colors, space } from "@/theme/tokens";

export default function CardSetup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(2);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(4);
  const [werewolfCardCount, setWerewolfCardCount] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(episodeThemes[0].category);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: 2 }, (_, i) => `プレイヤー${i + 1}`)
  );

  const totalCards = playerCount * cardsPerPlayer;
  const villagerCards = totalCards - werewolfCardCount;

  const clampWolf = (total: number) => {
    if (werewolfCardCount >= total) setWerewolfCardCount(Math.max(1, total - 1));
  };

  const updatePlayerCount = (next: number) => {
    if (next < 2) return;
    setPlayerCount(next);
    setNames((prev) => Array.from({ length: next }, (_, i) => prev[i] || `プレイヤー${i + 1}`));
    clampWolf(next * cardsPerPlayer);
  };

  const updateCards = (next: number) => {
    if (next < 3 || next > 8) return;
    setCardsPerPlayer(next);
    clampWolf(playerCount * next);
  };

  const handleName = (index: number, name: string) =>
    setNames((prev) => prev.map((n, i) => (i === index ? name : n)));

  const handleStart = async () => {
    await saveCardState({
      playerNames: names,
      cardsPerPlayer,
      werewolfCardCount,
      selectedTheme,
      currentPlayer: 0,
      currentRound: 1,
      winner: null,
    });
    router.push("/card-game");
  };

  return (
    <Screen scroll={false} edges={{ top: false, bottom: false }} avoidKeyboard>
      <Header
        icon="card"
        title="カードモード"
        subtitle="CARD MODE"
        onBack={() => router.replace("/")}
        right={<GameMenu mode="card" showRules={false} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <SectionCard icon="players" title="プレイヤー数" pill={<Pill>2人〜</Pill>}>
          <Stepper value={playerCount} min={2} onChange={updatePlayerCount} />
        </SectionCard>

        <SectionCard icon="cardBack" title="各プレイヤーのカード数">
          <Stepper value={cardsPerPlayer} min={3} max={8} onChange={updateCards} />
        </SectionCard>

        <SectionCard
          icon="wolf"
          title="人狼カード数"
          pill={<Pill icon="villager">村人 {villagerCards}枚</Pill>}
        >
          <Stepper value={werewolfCardCount} min={1} max={totalCards - 1} onChange={setWerewolfCardCount} />
          <Text style={styles.summary}>
            合計 {totalCards} 枚（村人 {villagerCards} 枚 + 人狼 {werewolfCardCount} 枚）
          </Text>
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
  summary: { marginTop: space.lg, textAlign: "center", fontSize: 13, fontWeight: "700", color: colors.ink600 },
});
