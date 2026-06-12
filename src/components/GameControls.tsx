import { useState, ReactNode } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { PressableScale } from "./PressableScale";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";
import { clearAll } from "@/game/storage";
import { colors, radius, space, type } from "@/theme/tokens";

interface Props {
  mode: "normal" | "card";
  /** ルール説明ボタン(?)を出すか。ゲーム本編では true、役職確認/結果では false。 */
  showRules?: boolean;
}

/**
 * ゲーム中ヘッダーの操作群。ハンバーガーは使わず、
 * 「やめる(✕)」を直接ボタンに、ルールがある画面のみ「?」を併設する。
 */
export function GameControls({ mode, showRules = true }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [rules, setRules] = useState(false);

  const quit = async () => {
    await clearAll();
    setConfirm(false);
    router.replace("/");
  };

  return (
    <View style={styles.row}>
      {showRules && <IconButton icon="rules" onPress={() => setRules(true)} />}
      <IconButton icon="close" onPress={() => setConfirm(true)} />

      {/* やめる確認 */}
      <Modal visible={confirm} transparent animationType="none" onRequestClose={() => setConfirm(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirm(false)} />
          <Animated.View entering={ZoomIn} style={styles.dialog}>
            <View style={styles.dialogIcon}>
              <Icon name="alert" size={26} color={colors.ink500} />
            </View>
            <Text style={styles.dialogTitle}>ゲームをやめますか？</Text>
            <Text style={styles.dialogBody}>ゲームの進行状況は失われます</Text>
            <View style={{ gap: space.sm, marginTop: space.lg }}>
              <PressableScale onPress={quit} style={[styles.dlgBtn, { backgroundColor: colors.ink900 }]}>
                <Text style={[styles.dlgBtnText, { color: colors.white }]}>やめてトップへ</Text>
              </PressableScale>
              <PressableScale onPress={() => setConfirm(false)} style={[styles.dlgBtn, { backgroundColor: colors.ink100 }]}>
                <Text style={[styles.dlgBtnText, { color: colors.ink600 }]}>つづける</Text>
              </PressableScale>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ルール説明 */}
      <Modal visible={rules} transparent animationType="none" onRequestClose={() => setRules(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRules(false)} />
          <Animated.View entering={ZoomIn} style={styles.rulesCard}>
            <View style={styles.rulesHead}>
              <Text style={styles.dialogTitle}>ルール説明</Text>
              <IconButton icon="close" box={32} size={18} bg={colors.ink100} color={colors.ink500} onPress={() => setRules(false)} />
            </View>
            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ padding: space.xl, gap: space.md }}>
              {mode === "normal" ? <NormalRules /> : <CardRules />}
            </ScrollView>
            <View style={{ padding: space.lg }}>
              <PressableScale onPress={() => setRules(false)} style={[styles.dlgBtn, { backgroundColor: colors.ink900 }]}>
                <Text style={[styles.dlgBtnText, { color: colors.white }]}>閉じる</Text>
              </PressableScale>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

function RuleBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.ruleBlock}>
      <Text style={styles.ruleTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Line({ children }: { children: ReactNode }) {
  return <Text style={styles.ruleLine}>{children}</Text>;
}

function NormalRules() {
  return (
    <>
      <RuleBlock title="基本ルール">
        <Line>エピソードテーマに沿って、村人は真実、人狼は嘘のエピソードを話します。議論と投票で人狼を見破りましょう。</Line>
      </RuleBlock>
      <RuleBlock title="勝利条件">
        <Line>村人：全ての人狼を追放する</Line>
        <Line>人狼：村人と同数以上になる</Line>
      </RuleBlock>
      <RuleBlock title="ゲームの流れ">
        <Line>1. エピソードテーマ発表</Line>
        <Line>2. エピソードタイム（自由に話す）</Line>
        <Line>3. 議論タイム（3分間）</Line>
        <Line>4. 投票で人狼を追放</Line>
        <Line>5. 勝利条件まで繰り返し</Line>
      </RuleBlock>
    </>
  );
}
function CardRules() {
  return (
    <>
      <RuleBlock title="基本ルール">
        <Line>各プレイヤーに村人カードと人狼カードが配られます。毎ラウンド1枚選んでエピソードを話し、人狼カードを見破りましょう。</Line>
      </RuleBlock>
      <RuleBlock title="勝利条件">
        <Line>全てのカードを使い切った人が勝ち。同時の場合は人狼カード使用数が多い方が勝利。</Line>
      </RuleBlock>
      <RuleBlock title="ゲームの流れ">
        <Line>1. 全員がカードを1枚選択</Line>
        <Line>2. 順番にエピソードを発表</Line>
        <Line>3. ダウトタイム（疑う人を選択）</Line>
        <Line>4. カード公開と判定</Line>
        <Line>5. 失敗した方に+1枚</Line>
        <Line>6. 誰かが全カード使い切るまで</Line>
      </RuleBlock>
      <RuleBlock title="ダウトのコツ">
        <Line>ダウト成功で相手に+1枚、失敗で自分に+1枚。確信がない時はパスも戦略。</Line>
      </RuleBlock>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: space.lg },
  dialog: { backgroundColor: colors.white, borderRadius: radius["2xl"], padding: space["2xl"], width: "100%", maxWidth: 320 },
  dialogIcon: { width: 48, height: 48, borderRadius: 999, backgroundColor: colors.ink100, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: space.md },
  dialogTitle: { ...type.h2, color: colors.ink800, textAlign: "center" },
  dialogBody: { ...type.small, color: colors.ink500, textAlign: "center", marginTop: 4 },
  dlgBtn: { height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  dlgBtnText: { ...type.body, fontWeight: "700" },

  rulesCard: { backgroundColor: colors.white, borderRadius: radius["2xl"], width: "100%", maxWidth: 420, overflow: "hidden" },
  rulesHead: { paddingHorizontal: space.xl, paddingVertical: space.lg, borderBottomWidth: 1, borderBottomColor: colors.ink200, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ruleBlock: { backgroundColor: colors.ink50, borderRadius: radius.lg, padding: space.lg },
  ruleTitle: { ...type.h3, color: colors.ink800, marginBottom: 6 },
  ruleLine: { ...type.body, fontWeight: "500", color: colors.ink600, lineHeight: 22 },
});
