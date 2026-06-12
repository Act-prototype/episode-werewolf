import { useState, ReactNode } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import Animated, { SlideInRight, SlideOutRight, FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { PressableScale } from "./PressableScale";
import { Icon, IconName } from "./Icon";
import { clearAll } from "@/game/storage";
import { colors, radius, space } from "@/theme/tokens";

interface Props {
  mode: "normal" | "card";
  showRules?: boolean;
}

/** 右上のハンバーガー → スライドインメニュー（ルール説明 / ホームに戻る + 確認）。 */
export function GameMenu({ mode, showRules = true }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [rules, setRules] = useState(false);

  const goHome = async () => {
    await clearAll();
    setConfirm(false);
    router.replace("/");
  };

  return (
    <>
      <PressableScale onPress={() => setOpen(true)} style={styles.hamburger}>
        <Icon name="menu" size={22} color={colors.ink300} />
      </PressableScale>

      {/* スライドインメニュー */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        </Animated.View>
        <Animated.View entering={SlideInRight} exiting={SlideOutRight} style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>メニュー</Text>
            <PressableScale onPress={() => setOpen(false)} style={styles.closeBtn}>
              <Icon name="close" size={18} color={colors.ink400} />
            </PressableScale>
          </View>

          <View style={{ padding: space.lg, gap: space.sm }}>
            {showRules && (
              <MenuItem icon="rules" label="ルール説明" onPress={() => { setOpen(false); setRules(true); }} />
            )}
            <MenuItem icon="home" label="ホームに戻る" onPress={() => { setOpen(false); setConfirm(true); }} />
          </View>

          <View style={styles.panelFoot}>
            <Text style={styles.footText}>エピソード人狼 v1.0</Text>
          </View>
        </Animated.View>
      </Modal>

      {/* ホーム確認ダイアログ */}
      <Modal visible={confirm} transparent animationType="none" onRequestClose={() => setConfirm(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.dialogScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirm(false)} />
          <Animated.View entering={ZoomIn} style={styles.dialog}>
            <View style={styles.dialogIcon}>
              <Icon name="alert" size={26} color={colors.ink500} />
            </View>
            <Text style={styles.dialogTitle}>ホームに戻りますか？</Text>
            <Text style={styles.dialogBody}>ゲームの進行状況は失われます</Text>
            <View style={{ gap: space.sm, marginTop: space.lg }}>
              <PressableScale onPress={goHome} style={[styles.dlgBtn, { backgroundColor: colors.ink900 }]}>
                <Text style={[styles.dlgBtnText, { color: colors.white }]}>ホームへ戻る</Text>
              </PressableScale>
              <PressableScale onPress={() => setConfirm(false)} style={[styles.dlgBtn, { backgroundColor: colors.ink100 }]}>
                <Text style={[styles.dlgBtnText, { color: colors.ink600 }]}>キャンセル</Text>
              </PressableScale>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ルール説明ダイアログ */}
      <Modal visible={rules} transparent animationType="none" onRequestClose={() => setRules(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.dialogScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRules(false)} />
          <Animated.View entering={ZoomIn} style={styles.rulesCard}>
            <View style={styles.rulesHead}>
              <Text style={styles.dialogTitle}>ルール説明</Text>
              <PressableScale onPress={() => setRules(false)} style={styles.closeBtnLight}>
                <Icon name="close" size={18} color={colors.ink500} />
              </PressableScale>
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
    </>
  );
}

function MenuItem({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.menuItem}>
      <Icon name={icon} size={20} color={colors.ink400} />
      <Text style={styles.menuItemText}>{label}</Text>
    </PressableScale>
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
  hamburger: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.ink800, alignItems: "center", justifyContent: "center" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  panel: { position: "absolute", right: 0, top: 0, bottom: 0, width: 288, maxWidth: "80%", backgroundColor: colors.ink900 },
  panelHead: { paddingHorizontal: space.xl, paddingVertical: space.xl, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.ink800 },
  panelTitle: { fontSize: 18, fontWeight: "800", color: colors.white },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.ink800, alignItems: "center", justifyContent: "center" },
  closeBtnLight: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.ink100, alignItems: "center", justifyContent: "center" },
  menuItem: { height: 56, borderRadius: radius.md, backgroundColor: colors.ink800, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg },
  menuItemText: { fontSize: 14, fontWeight: "700", color: colors.white },
  panelFoot: { marginTop: "auto", padding: space.lg, borderTopWidth: 1, borderTopColor: colors.ink800 },
  footText: { fontSize: 11, color: colors.ink600, textAlign: "center" },

  dialogScrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: space.lg },
  dialog: { backgroundColor: colors.white, borderRadius: radius["2xl"], padding: space["2xl"], width: "100%", maxWidth: 320 },
  dialogIcon: { width: 48, height: 48, borderRadius: 999, backgroundColor: colors.ink100, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: space.md },
  dialogTitle: { fontSize: 18, fontWeight: "800", color: colors.ink800, textAlign: "center" },
  dialogBody: { fontSize: 12, fontWeight: "500", color: colors.ink500, textAlign: "center", marginTop: 4 },
  dlgBtn: { height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  dlgBtnText: { fontSize: 14, fontWeight: "700" },

  rulesCard: { backgroundColor: colors.white, borderRadius: radius["2xl"], width: "100%", maxWidth: 420, overflow: "hidden" },
  rulesHead: { paddingHorizontal: space.xl, paddingVertical: space.lg, borderBottomWidth: 1, borderBottomColor: colors.ink200, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ruleBlock: { backgroundColor: colors.ink50, borderRadius: radius.lg, padding: space.lg },
  ruleTitle: { fontSize: 14, fontWeight: "800", color: colors.ink800, marginBottom: 6 },
  ruleLine: { fontSize: 14, color: colors.ink600, lineHeight: 22, fontWeight: "500" },
});
