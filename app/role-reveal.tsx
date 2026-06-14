import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { AppButton } from "@/components/AppButton";
import { GameControls } from "@/components/GameControls";
import { Icon } from "@/components/Icon";
import { InfoNote } from "@/components/InfoNote";
import { haptics } from "@/components/haptics";
import { GameState, Role } from "@/game/types";
import { assignRoles } from "@/game/gameLogic";
import { loadGameState, saveGameState } from "@/game/storage";
import { colors, radius, space, type } from "@/theme/tokens";

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
    if (revealed) return;
    haptics.reveal();
    setRevealed(true);
    const wolf = player.role === "人狼";
    // フリップ完了に合わせて役職確定の触覚
    setTimeout(() => (wolf ? haptics.warning() : haptics.success()), 560);
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
            <GameControls mode="normal" showRules={false} />
          </View>
        </View>
        <View style={styles.track}>
          <ProgressFill percent={progress} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={styles.turnHint}>{revealed ? "確認したら次へ" : "あなたの番です"}</Text>

        <RoleCard key={index} role={player.role!} revealed={revealed} onReveal={reveal} />

        {!revealed ? (
          <Animated.View entering={FadeIn} style={{ width: "100%" }}>
            <InfoNote>他のプレイヤーに見られないように{"\n"}カードをタップして確認してください</InfoNote>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(360)} style={{ width: "100%", gap: space.lg }}>
            <RolePoints role={player.role!} />
            <AppButton
              label={isLast ? "ゲーム開始" : "次のプレイヤーへ"}
              icon={isLast ? "play" : "forward"}
              iconTrailing
              onPress={next}
            />
          </Animated.View>
        )}
      </ScrollView>
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

/** タップでめくる3D役職カード（裏面→表面）＋役職オーラの脈動。 */
function RoleCard({ role, revealed, onReveal }: { role: Role; revealed: boolean; onReveal: () => void }) {
  const isWolf = role === "人狼";
  const flip = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  useEffect(() => {
    flip.value = withTiming(revealed ? 1 : 0, { duration: 600, easing: Easing.inOut(Easing.cubic) });
  }, [revealed]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${flip.value * 180 + 180}deg` }],
  }));
  const auraStyle = useAnimatedStyle(() => ({
    opacity: (revealed ? 0.4 : 0.16) + pulse.value * 0.22,
    transform: [{ scale: 1.02 + pulse.value * 0.05 }],
  }));

  return (
    <Pressable onPress={onReveal} disabled={revealed} style={styles.cardWrap}>
      <Animated.View
        style={[styles.aura, { backgroundColor: revealed ? (isWolf ? colors.wolf : colors.villager) : colors.ink600 }, auraStyle]}
      />
      {/* 裏面 */}
      <Animated.View style={[styles.face, styles.faceBack, frontStyle]}>
        <Icon name="wolf" size={52} color={colors.ink500} />
        <Text style={styles.backHint}>タップして役割を確認</Text>
      </Animated.View>
      {/* 表面（役職） */}
      <Animated.View
        style={[
          styles.face,
          { backgroundColor: isWolf ? colors.wolf : colors.villager, borderColor: isWolf ? colors.wolfBorder : colors.villagerBorder, borderWidth: 3 },
          backStyle,
        ]}
      >
        <Icon name={isWolf ? "wolf" : "villager"} size={58} color={colors.white} />
        <Text style={styles.roleName}>{role}</Text>
        <Text style={styles.roleSub}>{isWolf ? "WEREWOLF" : "VILLAGER"}</Text>
      </Animated.View>
    </Pressable>
  );
}

function RolePoints({ role }: { role: Role }) {
  const isWolf = role === "人狼";
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
    <Card style={{ gap: space.md }}>
      {points.map((p, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.delay(120 + i * 80)}
          style={[styles.point, { backgroundColor: isWolf ? colors.wolfSurface : colors.villagerSurface, borderColor: isWolf ? colors.wolfBorder : colors.villagerBorder }]}
        >
          <Icon name={p.icon} size={24} color={isWolf ? colors.wolf : colors.villager} />
          <Text style={styles.pointText}>{p.text}</Text>
        </Animated.View>
      ))}
    </Card>
  );
}

const CARD_H = 240;

const styles = StyleSheet.create({
  progressWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.ink200, paddingHorizontal: space["2xl"], paddingVertical: space.xl },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md },
  progressRight: { flexDirection: "row", alignItems: "center", gap: space.md },
  progressLabel: { fontSize: 14, fontWeight: "800", color: colors.ink800 },
  track: { height: 12, backgroundColor: colors.ink200, borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.ink900, borderRadius: 999 },

  body: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.lg },
  playerName: { fontSize: 26, fontWeight: "800", color: colors.ink800, letterSpacing: -0.3 },
  turnHint: { ...type.body, color: colors.ink500, marginTop: -space.xs },

  cardWrap: { width: "100%", height: CARD_H, alignItems: "center", justifyContent: "center" },
  aura: { position: "absolute", width: "92%", height: CARD_H - 8, borderRadius: radius["3xl"] },
  face: {
    position: "absolute",
    width: "100%",
    height: CARD_H,
    borderRadius: radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
  },
  faceBack: { backgroundColor: colors.ink800, borderWidth: 2, borderColor: colors.ink700, gap: space.md },
  backHint: { ...type.body, color: colors.ink400 },
  roleName: { fontSize: 32, fontWeight: "800", color: colors.white, marginTop: space.sm },
  roleSub: { fontSize: 13, fontWeight: "800", color: "rgba(255,255,255,0.9)", letterSpacing: 3, marginTop: 4 },
  point: { flexDirection: "row", alignItems: "center", gap: space.lg, padding: space.lg, borderRadius: radius.md, borderWidth: 1 },
  pointText: { fontSize: 14, fontWeight: "800", color: colors.ink800, flexShrink: 1 },
});
