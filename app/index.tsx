import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { SketchButton } from "@/components/sketch/SketchButton";
import { SketchDivider } from "@/components/sketch/SketchDivider";
import { SketchNumber } from "@/components/sketch/SketchNumber";
import { colors, space, type } from "@/theme/tokens";

export default function ModeSelection() {
  const router = useRouter();

  return (
    <Screen
      scroll
      edges={{ top: true, bottom: true }}
      contentContainerStyle={styles.content}
    >
      <Animated.View entering={FadeIn.duration(220)} style={styles.stack}>
        <ModeBlock
          title="NORMAL Mode"
          subtitle="3人以上でプレイ"
          flow={[
            "テーマのエピソードを話す",
            "みんなで誰が人狼か話し合う",
            "人狼っぽい人を投票して追放",
            "勝敗が決まるまで繰り返す",
          ]}
          buttonLabel="ノーマルモードでプレイ"
          buttonVariant="blue"
          onPress={() => router.push("/setup-normal")}
        />

        <ModeBlock
          title="CARD Mode"
          subtitle="2人以上でプレイ"
          flow={[
            "カードを手札から選んで話す",
            "怪しいエピソードを「ダウト」",
            "外したら自分に+1枚",
            "先に手札を使い切れば勝利",
          ]}
          buttonLabel="カードモードでプレイ"
          buttonVariant="red"
          onPress={() => router.push("/setup-card")}
        />
      </Animated.View>
    </Screen>
  );
}

interface ModeBlockProps {
  title: string;
  subtitle: string;
  flow: string[];
  buttonLabel: string;
  buttonVariant: "blue" | "red";
  onPress: () => void;
}

/** モックの1モード分のかたまり: 見出し → 人数 → 罫線 → 手順 → ボタン */
function ModeBlock({ title, subtitle, flow, buttonLabel, buttonVariant, onPress }: ModeBlockProps) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <SketchDivider weight="long" width={185} height={4} style={styles.rule} />

      <View style={styles.flow}>
        {flow.map((step, i) => (
          <View key={i} style={styles.step}>
            <SketchNumber value={i + 1} height={15} style={styles.stepNum} />
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <SketchButton
        label={buttonLabel}
        variant={buttonVariant}
        onPress={onPress}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space["3xl"], paddingBottom: space["3xl"] },
  stack: { gap: 56, paddingTop: space["3xl"] },

  block: { alignItems: "stretch" },
  title: { ...type.display, color: colors.ink, textAlign: "center" },
  subtitle: { ...type.small, color: colors.ink, textAlign: "center", marginTop: space.xs },
  rule: { alignSelf: "center", marginTop: space.md, marginBottom: space.xl },

  flow: { gap: space.md, paddingLeft: space.md, marginBottom: space["2xl"] },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  // 数字の幅は桁によって変わるので、テキストの開始位置を揃えるため固定幅を持たせる
  stepNum: { width: 14, justifyContent: "flex-end" },
  stepText: { ...type.body, color: colors.ink, flexShrink: 1 },

  // モックのボタンは画面幅の7割弱。上限を効かせて広い端末でも伸びきらないようにする
  cta: { alignSelf: "center", width: "100%", maxWidth: 300 },
});
