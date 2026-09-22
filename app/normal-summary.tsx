import { useEffect, useRef, useState } from "react";
import { Alert, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { PressableScale } from "@/components/PressableScale";
import { SketchButton } from "@/components/sketch/SketchButton";
import { SketchDivider } from "@/components/sketch/SketchDivider";
import { ResultGrid } from "@/components/ResultGrid";
import { SketchFrame } from "@/components/sketch/SketchFrame";
import { GameState } from "@/game/types";
import { getNormalStandings } from "@/game/gameLogic";
import { clearGameState, loadGameState, restartSavedNormalSession } from "@/game/storage";
import { colors, space, type } from "@/theme/tokens";

export default function NormalSummary() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadGameState();
        if (!saved) return router.replace("/mode-select");
        if (saved.currentPhase !== "sessionSummary") return router.replace(saved.currentPhase === "roleReveal" ? "/role-reveal" : "/game");
        setState(saved);
      } catch { setLoadingError(true); }
    })();
  }, []);

  const leave = async (destination: "/setup-normal" | "/mode-select" | "/role-reveal") => {
    if (!state || busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      if (destination === "/role-reveal") await restartSavedNormalSession();
      else await clearGameState();
      router.replace(destination);
    } catch {
      Alert.alert("保存できませんでした", "集計はそのまま残っています。もう一度お試しください。");
    } finally { busy.current = false; setSaving(false); }
  };

  if (!state) return <Screen scroll contentContainerStyle={styles.content}>{loadingError && <>
    <Text style={styles.lead}>集計を読み込めませんでした。</Text>
    <SketchButton label="ホームへ" onPress={() => router.replace("/mode-select")} />
  </>}</Screen>;

  const standings = getNormalStandings(state);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Text style={styles.title}>全体集計</Text>
      <Text style={styles.lead}>このメンバーで {state.session.completedRounds}ゲーム</Text>
      <Text style={styles.lead}>負けるたびにグラスが1杯。{"\n"}少ない人ほど上位です。</Text>
      <SketchDivider weight="medium" width={180} height={5} style={styles.divider} />
      {state.session.completedRounds === 0 && <Text style={styles.lead}>まだ結果が確定したゲームはありません。</Text>}
      <SketchFrame contentStyle={styles.results}>
        <ResultGrid players={standings.map(row => state.players[row.id])} points={state.session.lossPoints}
          ranks={state.session.completedRounds > 0 ? Object.fromEntries(standings.map(row => [row.id, `${row.tied ? "同率" : ""}${row.rank}位`])) : undefined} />
      </SketchFrame>
      <Text style={styles.note}>1杯 = 1負けポイント。途中でやめたゲームは集計しません。</Text>
      <View style={styles.actions}>
        <SketchButton label="メンバーを変える" onPress={() => void leave("/setup-normal")} disabled={saving} />
        <Text style={styles.note}>新しいメンバーでは全員0杯からスタート。</Text>
        <SketchButton label="同じメンバーで0杯から" onPress={() => void leave("/role-reveal")} disabled={saving} />
        <Text style={styles.note}>杯数とゲーム数をリセットして、配役も引き直します。</Text>
        <PressableScale accessibilityRole="button" accessibilityLabel="ホームへ" onPress={() => void leave("/mode-select")} disabled={saving} style={styles.home}>
          <Text style={styles.lead}>ホームへ</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingTop: space["3xl"], paddingBottom: space["3xl"], gap: space.lg },
  title: { ...type.title, fontSize: 26, color: colors.ink, textAlign: "center" },
  lead: { ...type.body, color: colors.ink, textAlign: "center", lineHeight: 22 },
  divider: { alignSelf: "center" },
  results: { paddingVertical: space.sm },
  note: { ...type.small, color: colors.inkSub, textAlign: "center", lineHeight: 21 },
  actions: { gap: space.md, marginTop: space.md },
  home: { padding: space.md },
});
