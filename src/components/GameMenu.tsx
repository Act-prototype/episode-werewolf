import { useState, ReactNode } from "react";
import { View, Text, Image, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import Animated, { SlideInRight, SlideOutRight, FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { PressableScale } from "./PressableScale";
import { PaperBackground } from "./sketch/PaperBackground";
import { SketchButton } from "./sketch/SketchButton";
import { SketchDivider } from "./sketch/SketchDivider";
import { SketchNumber } from "./sketch/SketchNumber";
import { SketchOptionRow } from "./sketch/SketchOptionRow";
import { RoleArt } from "./sketch/RoleArt";
import { clearAll } from "@/game/storage";
import { sketch } from "@/theme/sketchAssets";
import { colors, radius, space, type } from "@/theme/tokens";

interface Props {
  mode: "normal" | "card";
  showRules?: boolean;
}

/**
 * 右上のハンバーガー → 紙の上に開くメニュー。
 * 本文と同じ紙・インクの語彙で組み、区切りは手書きの罫線を使う。
 */
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
        <Image source={sketch.iconMenu} style={styles.hamburgerIcon} resizeMode="contain" />
      </PressableScale>

      {/* メニュー本体。別の紙が右から差し込まれるように見せる */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        </Animated.View>
        <Animated.View entering={SlideInRight} exiting={SlideOutRight} style={styles.panel}>
          <PaperBackground />

          <View style={styles.panelBody}>
            <Text style={styles.panelTitle}>MENU</Text>
            <SketchDivider weight="medium" width={120} height={5} style={styles.centered} />

            <View style={styles.panelItems}>
              {showRules && (
                <SketchOptionRow
                  label="あそびかた"
                  onPress={() => {
                    setOpen(false);
                    setRules(true);
                  }}
                />
              )}
              <SketchOptionRow
                label="ホームに戻る"
                onPress={() => {
                  setOpen(false);
                  setConfirm(true);
                }}
              />
              <SketchOptionRow label="とじる" onPress={() => setOpen(false)} />
            </View>

            <View style={styles.panelFoot}>
              <SketchDivider weight="hair" height={4} />
              <Text style={styles.footText}>エピソード人狼 v1.0</Text>
            </View>
          </View>
        </Animated.View>
      </Modal>

      {/* ホームに戻る確認 */}
      <Modal
        visible={confirm}
        transparent
        animationType="none"
        onRequestClose={() => setConfirm(false)}
      >
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.dialogScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirm(false)} />
          <Animated.View entering={ZoomIn} style={styles.dialog}>
            <PaperBackground />
            <View style={styles.dialogBody}>
              <Text style={styles.dialogTitle}>ホームに戻る？</Text>
              <SketchDivider weight="fine" width={140} height={3} style={styles.centered} />
              <Text style={styles.dialogText}>いままでの進行は消えます</Text>

              <View style={styles.dialogActions}>
                <SketchButton label="戻る" onPress={goHome} />
                <SketchOptionRow label="やめる" onPress={() => setConfirm(false)} />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* あそびかた */}
      <Modal visible={rules} transparent animationType="none" onRequestClose={() => setRules(false)}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.dialogScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRules(false)} />
          <Animated.View entering={ZoomIn} style={styles.rulesCard}>
            <PaperBackground />
            <View style={styles.rulesBody}>
              <Text style={styles.dialogTitle}>あそびかた</Text>
              <SketchDivider weight="medium" width={140} height={5} style={styles.centered} />

              <ScrollView
                style={{ maxHeight: 400 }}
                contentContainerStyle={styles.rulesScroll}
                showsVerticalScrollIndicator={false}
              >
                {mode === "normal" ? <NormalRules /> : <CardRules />}
              </ScrollView>

              <SketchButton label="わかった" onPress={() => setRules(false)} />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

/** 見出し + 手書き罫線 */
function RuleBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.ruleBlock}>
      <Text style={styles.ruleTitle}>{title}</Text>
      <SketchDivider weight="fine" width={90} height={3} />
      <View style={styles.ruleLines}>{children}</View>
    </View>
  );
}

/** 本文1行 */
function Line({ children }: { children: ReactNode }) {
  return <Text style={styles.ruleLine}>{children}</Text>;
}

/** 手順1行。番号は手書き数字で組む */
function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <View style={styles.step}>
      <SketchNumber value={n} height={14} style={styles.stepNum} />
      <Text style={[styles.ruleLine, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

/** 役職の行。イラストを添えて勝ち条件を書く */
function RoleLine({ role, children }: { role: "人狼" | "村人"; children: ReactNode }) {
  return (
    <View style={styles.roleLine}>
      <RoleArt role={role} size={34} />
      <View style={{ flex: 1 }}>
        <Text style={styles.roleLineName}>{role}</Text>
        <Text style={styles.ruleLine}>{children}</Text>
      </View>
    </View>
  );
}

function NormalRules() {
  return (
    <>
      <RuleBlock title="どんなゲーム？">
        <Line>
          テーマに沿ってエピソードを話します。村人はほんとうの話、人狼はうその話。
          話を聞いて、うそをついている人狼を探し出すゲームです。
        </Line>
      </RuleBlock>

      <RuleBlock title="役職と勝ち">
        <RoleLine role="村人">全ての人狼を追放できたら勝ち</RoleLine>
        <RoleLine role="人狼">村人と同数以上まで生き残れば勝ち</RoleLine>
      </RuleBlock>

      <RuleBlock title="1日の流れ">
        <Step n={1}>テーマ発表</Step>
        <Step n={2}>自分語りタイム（順番は自由）</Step>
        <Step n={3}>犯人探しタイム（時間内に議論）</Step>
        <Step n={4}>投票して1人を追放</Step>
        <Step n={5}>勝敗がつくまで翌日へ</Step>
      </RuleBlock>

      <RuleBlock title="コツ">
        <Line>
          具体的に話しすぎると嘘がバレます。逆に曖昧すぎても疑われます。
          誰も追放しない選択もできます。
        </Line>
      </RuleBlock>
    </>
  );
}

function CardRules() {
  return (
    <>
      <RuleBlock title="どんなゲーム？">
        <Line>
          手札には村人カードと人狼カードが混ざっています。毎ラウンド1枚えらび、
          そのカードに従ってエピソードを話します。手札を先に使い切った人が勝ちです。
        </Line>
      </RuleBlock>

      <RuleBlock title="カード">
        <RoleLine role="村人">ほんとうにあったハナシを話す</RoleLine>
        <RoleLine role="人狼">うそのエピソードを話す</RoleLine>
      </RuleBlock>

      <RuleBlock title="1ラウンドの流れ">
        <Step n={1}>テーマ発表</Step>
        <Step n={2}>全員がカードを1枚えらぶ</Step>
        <Step n={3}>順番にエピソードを話す</Step>
        <Step n={4}>ダウトタイム（怪しい人を選ぶ）</Step>
        <Step n={5}>カードを公開して判定</Step>
      </RuleBlock>

      <RuleBlock title="ダウト">
        <Line>
          当たれば出した人に+1枚、外せば自分に+1枚。パスもできます。
          手札が増えるほど不利になるので、疑うタイミングが勝負です。
        </Line>
      </RuleBlock>

      <RuleBlock title="勝ち">
        <Line>
          先に手札を使い切った人の勝ち。同時なら人狼カードを多く使った人が勝ちです。
        </Line>
      </RuleBlock>
    </>
  );
}

const styles = StyleSheet.create({
  hamburger: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  hamburgerIcon: { width: 30, height: 25 },
  centered: { alignSelf: "center" },

  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  panel: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    maxWidth: "85%",
    backgroundColor: colors.paper,
    overflow: "hidden",
  },
  panelBody: { flex: 1, paddingTop: 72, paddingHorizontal: space.xl, gap: space.lg },
  panelTitle: { ...type.display, color: colors.ink, textAlign: "center" },
  panelItems: { gap: space.md, marginTop: space.lg },
  panelFoot: { marginTop: "auto", paddingBottom: space["3xl"], gap: space.sm },
  footText: { ...type.caption, color: colors.inkSub, textAlign: "center" },

  dialogScrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
  },
  dialog: {
    width: "100%",
    maxWidth: 330,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.ink300,
    overflow: "hidden",
  },
  dialogBody: { padding: space["2xl"], gap: space.md, alignItems: "center" },
  dialogTitle: { ...type.title, color: colors.ink, textAlign: "center" },
  dialogText: { ...type.small, color: colors.inkSub, textAlign: "center" },
  dialogActions: { width: "100%", gap: space.md, marginTop: space.md },

  rulesCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.ink300,
    overflow: "hidden",
  },
  rulesBody: { padding: space.xl, gap: space.md },
  rulesScroll: { gap: space.xl, paddingVertical: space.md },

  ruleBlock: { gap: space.xs },
  ruleTitle: { ...type.h2, color: colors.ink },
  ruleLines: { gap: space.sm, marginTop: space.xs },
  ruleLine: { ...type.small, color: colors.inkSub, lineHeight: 21 },

  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  // 数字の幅は桁で変わるので、文の開始位置を揃えるため固定幅を持たせる
  stepNum: { width: 13, justifyContent: "flex-end" },

  roleLine: { flexDirection: "row", alignItems: "center", gap: space.md },
  roleLineName: { ...type.body, color: colors.ink },
});
