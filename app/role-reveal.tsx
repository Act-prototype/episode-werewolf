import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { AppButton } from "@/components/AppButton";
import { GameMenu } from "@/components/GameMenu";
import { IconBadge } from "@/components/IconBadge";
import { Icon } from "@/components/Icon";
import { InfoNote } from "@/components/InfoNote";
import { haptics } from "@/components/haptics";
import { GameState } from "@/game/types";
import { assignRoles } from "@/game/gameLogic";
import { loadGameState, saveGameState } from "@/game/storage";
import { colors, radius, space } from "@/theme/tokens";

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
  const progress = ((index + 1) / state.players.length) * 100;

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
    <Screen scroll={false} background={colors.ink50}>
      {/* プログレス */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>役割確認</Text>
          <View style={styles.progressRight}>
            <Text style={styles.progressLabel}>
              {index + 1} / {state.players.length}
            </Text>
            <GameMenu mode="normal" showRules={false} />
          </View>
        </View>
        <View style={styles.track}>
          <ProgressFill percent={progress} />
        </View>
      </View>

      <View style={styles.body}>
        {!revealed ? (
          <Animated.View key="hidden" entering={FadeIn} style={{ gap: space["2xl"], width: "100%" }}>
            <Card padded elevation="raised" style={{ alignItems: "center", paddingVertical: 48 }}>
              <IconBadge icon="villager" box={120} size={64} rounded="circle" bg={colors.ink900} />
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.turnHint}>あなたの番です</Text>
            </Card>
            <InfoNote>他のプレイヤーに見られないように{"\n"}あなたの役割を確認してください</InfoNote>
            <AppButton label="役割を見る" icon="hide" size="lg" onPress={reveal} />
          </Animated.View>
        ) : (
          <FlipCard key="visible" role={player.role!} isLast={isLast} onNext={next} />
        )}
      </View>
    </Screen>
  );
}

function ProgressFill({ percent }: { percent: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(percent, { duration: 450 });
  }, [percent]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return <Animated.View style={[styles.fill, style]} />;
}

function FlipCard({ role, isLast, onNext }: { role: "人狼" | "村人"; isLast: boolean; onNext: () => void }) {
  const isWolf = role === "人狼";
  const rot = useSharedValue(90);
  useEffect(() => {
    rot.value = withTiming(0, { duration: 520 });
  }, []);
  const flip = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateY: `${rot.value}deg` }] }));

  const points = isWolf
    ? [
        { icon: "acting" as const, text: "嘘のエピソードを話す" },
        { icon: "hide" as const, text: "正体がバレないように演技" },
        { icon: "trophy" as const, text: "村人と同数以上で勝利" },
      ]
    : [
        { icon: "theme" as const, text: "真実のエピソードを話す" },
        { icon: "vote" as const, text: "議論と投票で人狼を探す" },
        { icon: "trophy" as const, text: "全ての人狼を追放で勝利" },
      ];

  return (
    <Animated.View entering={FadeIn} style={{ gap: space["2xl"], width: "100%" }}>
      <Animated.View
        style={[
          styles.roleCard,
          { backgroundColor: isWolf ? colors.wolf : colors.villager, borderColor: isWolf ? colors.wolfBorder : colors.villagerBorder },
          flip,
        ]}
      >
        <Icon name={isWolf ? "wolf" : "villager"} size={96} color={colors.white} />
        <Text style={styles.roleName}>{role}</Text>
        <Text style={styles.roleSub}>{isWolf ? "WEREWOLF" : "VILLAGER"}</Text>
      </Animated.View>

      <Card style={{ gap: space.md }}>
        {points.map((p, i) => (
          <View
            key={i}
            style={[styles.point, { backgroundColor: isWolf ? colors.wolfSurface : colors.villagerSurface, borderColor: isWolf ? colors.wolfBorder : colors.villagerBorder }]}
          >
            <Icon name={p.icon} size={24} color={isWolf ? colors.wolf : colors.villager} />
            <Text style={styles.pointText}>{p.text}</Text>
          </View>
        ))}
      </Card>

      <AppButton
        label={isLast ? "ゲーム開始" : "次のプレイヤーへ"}
        icon={isLast ? "play" : "forward"}
        iconTrailing
        onPress={onNext}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  progressWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.ink200, paddingHorizontal: space["2xl"], paddingVertical: space.xl },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md },
  progressRight: { flexDirection: "row", alignItems: "center", gap: space.md },
  progressLabel: { fontSize: 14, fontWeight: "800", color: colors.ink800 },
  track: { height: 12, backgroundColor: colors.ink200, borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.ink900, borderRadius: 999 },

  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: space["2xl"] },
  playerName: { fontSize: 44, fontWeight: "800", color: colors.ink800, marginTop: space.xl, letterSpacing: -0.5 },
  turnHint: { fontSize: 18, fontWeight: "700", color: colors.ink500, marginTop: 4 },

  roleCard: { borderRadius: radius["3xl"], paddingVertical: 56, alignItems: "center", borderWidth: 4 },
  roleName: { fontSize: 56, fontWeight: "800", color: colors.white, marginTop: space.lg },
  roleSub: { fontSize: 18, fontWeight: "800", color: "rgba(255,255,255,0.9)", letterSpacing: 4, marginTop: 4 },
  point: { flexDirection: "row", alignItems: "center", gap: space.lg, padding: space.lg, borderRadius: radius.md, borderWidth: 1 },
  pointText: { fontSize: 14, fontWeight: "800", color: colors.ink800, flexShrink: 1 },
});
