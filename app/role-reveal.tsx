import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
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

  useEffect(() => {
    (async () => {
      const saved = await loadGameState();
      if (!saved) return router.replace("/");
      if (!saved.players[0].role) {
        const roles = assignRoles(saved.players.length, saved.werewolfCount);
        saved.players = saved.players.map((p, i) => ({ ...p, role: roles[i] }));
        await saveGameState(saved);
      }
      setState(saved);
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
    const players = [...state.players];
    players[index] = { ...players[index], hasSeenRole: true };
    if (isLast) {
      await saveGameState({ ...state, players, currentPhase: "episodeAnnouncement" });
      router.replace("/game");
    } else {
      const updated = { ...state, players };
      await saveGameState(updated);
      setState(updated);
      setIndex(index + 1);
      setRevealed(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.menu}>
        <GameMenu mode="normal" showRules={false} />
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
                ? ["うそのエピソードをはなす", "正体がバレないように演技", "村人と同数以上で勝ち"]
                : ["ほんとうにあったハナシをはなす", "人狼をみつける", "全ての人狼を追放したら勝ち"]
              ).map((line) => (
                <Text key={line} style={styles.rule}>
                  {line}
                </Text>
              ))}
            </View>

            <SketchButton
              label={isLast ? "ゲームをはじめる" : "わかったよ..."}
              onPress={next}
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
