import { useEffect, useRef, useState } from "react";
import { Alert, View, Text, Image, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { GameMenu } from "@/components/GameMenu";
import { SketchButton } from "@/components/sketch/SketchButton";
import { SketchFrame } from "@/components/sketch/SketchFrame";
import { RoleArt } from "@/components/sketch/RoleArt";
import { haptics } from "@/components/haptics";
import { GameState } from "@/game/types";
import { assignRoles } from "@/game/gameLogic";
import { loadGameState, saveGameState } from "@/game/storage";
import { sketch } from "@/theme/sketchAssets";
import { colors, space, type } from "@/theme/tokens";


export default function RoleReveal() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadGameState();
        if (!saved) return router.replace("/mode-select");
        if (saved.currentPhase !== "roleReveal") return router.replace("/game");
        if (saved.players.every((player) => player.role === null)) {
          const roles = assignRoles(saved.players.length, 1);
          saved.players = saved.players.map((p, i) => ({ ...p, role: roles[i] }));
          await saveGameState(saved);
        }
        const nextIndex = saved.players.findIndex((player) => !player.hasSeenRole);
        if (nextIndex === -1) {
          await saveGameState({ ...saved, currentPhase: "episodeAnnouncement" });
          return router.replace("/game");
        }
        setIndex(nextIndex);
        setState(saved);
      } catch {
        Alert.alert("読み込めませんでした", "もう一度お試しください。");
        router.replace("/mode-select");
      }
    })();
  }, []);

  if (!state) return <Screen>{null}</Screen>;

  const player = state.players[index];
  const isLast = index === state.players.length - 1;

  const reveal = () => {
    haptics.reveal();
    setRevealed(true);
  };

  const next = async () => {
    if (savingRef.current || !revealed) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const players = state.players.map((p, i) => i === index ? { ...p, hasSeenRole: true } : p);
      const updated: GameState = { ...state, players, currentPhase: isLast ? "episodeAnnouncement" : "roleReveal" };
      await saveGameState(updated);
      if (isLast) {
        router.replace("/game");
      } else {
        setRevealed(false);
        setState(updated);
        setIndex(index + 1);
      }
    } catch {
      Alert.alert("保存できませんでした", "もう一度お試しください。");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.menu}>
        <GameMenu mode="normal" showRules={false} disabled={saving} />
      </View>

      <View style={styles.body}>
        <Text style={styles.heading}>Who are you?</Text>

        {!revealed ? (
          <Animated.View key="hidden" entering={FadeIn.duration(200)} style={styles.stack}>
            <SketchFrame contentStyle={styles.frameContent}>
              <Image source={sketch.humanSolid} style={styles.human} resizeMode="contain" />
              <Text style={styles.name}>{player.name}のばん</Text>
            </SketchFrame>

            <Text style={styles.hint}>ほかのひとにみられないようにね</Text>

            <SketchButton label="ワタシはだれ？" onPress={reveal} style={styles.button} />
          </Animated.View>
        ) : (
          <Animated.View key="shown" entering={FadeIn.duration(260)} style={styles.stack}>
            <SketchFrame contentStyle={styles.frameContent}>
              <RoleArt role={player.role!} size={170} variant={player.id} />
              <Text style={styles.name}>{player.role}</Text>
            </SketchFrame>

            <View style={styles.rules}>
              {(player.role === "人狼"
                ? ["うそのエピソードをはなす", "正体がバレないように演技", "投票で村人が選ばれたら勝ち"]
                : ["ほんとうにあったハナシをはなす", "人狼をみつける", "1回の投票で人狼を当てたら勝ち"]
              ).map((line) => (
                <Text key={line} style={styles.rule}>
                  {line}
                </Text>
              ))}
            </View>

            <SketchButton
              label={isLast ? "ゲームをはじめる" : "わかったよ..."}
              onPress={next}
              disabled={saving}
              style={styles.button}
            />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  menu: { position: "absolute", top: space["4xl"], right: space.xl, zIndex: 2 },
  body: { flex: 1, paddingHorizontal: space["2xl"], paddingTop: 96 },
  heading: { ...type.display, color: colors.ink, textAlign: "center" },
  stack: { marginTop: space["3xl"], gap: space.xl },

  frameContent: { alignItems: "center", paddingVertical: space.sm, gap: space.lg },
  human: { width: 78, height: 138 },
  name: { ...type.title, color: colors.ink, textAlign: "center" },

  hint: { ...type.small, color: colors.inkSub, textAlign: "center" },
  rules: { gap: space.xs, alignItems: "center" },
  rule: { ...type.small, color: colors.inkSub, textAlign: "center" },

  button: { marginTop: space.md },
});
