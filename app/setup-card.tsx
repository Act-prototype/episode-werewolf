import { useState } from "react";
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
import { saveCardState } from "@/game/storage";
import { colors, space, type } from "@/theme/tokens";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;
const MIN_CARDS = 3;
const MAX_CARDS = 8;

export default function CardSetup() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(2);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(4);
  const [werewolfCardCount, setWerewolfCardCount] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState(episodeThemes[0].category);
  const [names, setNames] = useState<string[]>(
    Array.from({ length: MIN_PLAYERS }, (_, i) => defaultPlayerName(i))
  );

  const totalCards = playerCount * cardsPerPlayer;
  const villagerCards = totalCards - werewolfCardCount;

  /** 人狼カードは全体より1枚以上少なくする（全部が人狼だとゲームにならない） */
  const clampWolf = (total: number) =>
    setWerewolfCardCount((w) => Math.min(w, Math.max(1, total - 1)));

  const updatePlayerCount = (next: number) => {
    setPlayerCount(next);
    setNames((prev) => Array.from({ length: next }, (_, i) => prev[i] || defaultPlayerName(i)));
    clampWolf(next * cardsPerPlayer);
  };

  const updateCards = (next: number) => {
    setCardsPerPlayer(next);
    clampWolf(playerCount * next);
  };

  const handleName = (index: number, name: string) =>
    setNames((prev) => prev.map((n, i) => (i === index ? name : n)));

  const handleStart = async () => {
    await saveCardState({
      // 名前欄の数ではなくプレイヤー数を人数の正とする
      playerNames: Array.from({ length: playerCount }, (_, i) => names[i] || defaultPlayerName(i)),
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
    <Screen scroll={false} edges={{ top: true, bottom: true }} avoidKeyboard>
      <View style={styles.menu}>
        <GameMenu mode="card" />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.heading}>SETTING</Text>
        <Text style={styles.mode}>CARD Mode</Text>

        <SketchFrame style={styles.section} contentStyle={styles.steppers}>
          <SketchStepper
            label="プレイヤー"
            value={playerCount}
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            onChange={updatePlayerCount}
          />
          <SketchStepper
            label="手札の枚数"
            value={cardsPerPlayer}
            min={MIN_CARDS}
            max={MAX_CARDS}
            onChange={updateCards}
          />
          <SketchStepper
            label="人狼カード"
            value={werewolfCardCount}
            min={1}
            max={Math.max(1, totalCards - 1)}
            onChange={setWerewolfCardCount}
          />
          <Text style={styles.summary}>
            ぜんぶで {totalCards} 枚（村人 {villagerCards} ／ 人狼 {werewolfCardCount}）
          </Text>
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
  mode: { ...type.overlineEn, color: colors.inkSub, textAlign: "center", marginTop: -space.lg },

  section: {},
  steppers: { paddingVertical: space.md, gap: space.xl },
  group: { paddingVertical: space.md, gap: space.lg },
  summary: { ...type.small, color: colors.inkSub, textAlign: "center" },

  sectionTitle: { alignItems: "center", gap: space.xs },
  sectionLabel: { ...type.h2, color: colors.ink },

  start: { marginTop: space.md },
});
