import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { IconBadge } from "@/components/IconBadge";
import { Icon } from "@/components/Icon";
import { AppButton } from "@/components/AppButton";
import { PressableScale } from "@/components/PressableScale";
import { colors, radius, space } from "@/theme/tokens";

type Mode = "normal" | "card";

export default function ModeSelection() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Mode | null>(null);

  return (
    <Screen scroll background={colors.ink50} edges={{ top: false, bottom: true }} contentContainerStyle={{ paddingBottom: space["2xl"] }}>
      <Header
        icon="wolf"
        title="エピソード人狼"
        subtitle="EPISODE WEREWOLF"
        variant="hero"
      />

      <View style={{ padding: space.xl, gap: space.lg }}>
        <View style={{ alignItems: "center", gap: 4, marginBottom: space.xs }}>
          <Text style={styles.lead}>ゲームモードを選択</Text>
          <Text style={styles.sub}>ルールを確認して遊び方を選んでください</Text>
        </View>

        <ModeCard
          mode="normal"
          icon="players"
          title="通常モード"
          minLabel="3人以上"
          tag="大人数におすすめ"
          expanded={expanded === "normal"}
          onToggle={() => setExpanded(expanded === "normal" ? null : "normal")}
          onPlay={() => router.push("/setup-normal")}
          rules={[
            "各プレイヤーに役割（村人 or 人狼）が配られます",
            "人狼は嘘のエピソードを話します",
            "村人は本当のエピソードを話します",
            "議論後に投票で人狼を見つけ出します",
            "人狼を全員追放すれば村人の勝ち",
            "人狼の数 ≧ 村人の数になったら人狼の勝ち",
          ]}
          playLabel="通常モードで遊ぶ"
        />

        <ModeCard
          mode="card"
          icon="card"
          title="カードモード"
          minLabel="2人以上"
          tag="二人でも楽しめる"
          expanded={expanded === "card"}
          onToggle={() => setExpanded(expanded === "card" ? null : "card")}
          onPlay={() => router.push("/setup-card")}
          rules={[
            "各プレイヤーに伏せカードが配られます",
            "人狼カード = 嘘のエピソード",
            "村人カード = 本当のエピソード",
            "順番にカードを1枚選んでエピソードを話す",
            "他プレイヤーは「ダウト！」できる",
            "ダウト成功 = カードを出した人に+1枚",
            "ダウト失敗 = ダウトした人に+1枚",
            "全カードを使い切った人が勝ち！",
            "同時使い切り = 人狼カード使用数で判定",
          ]}
          playLabel="カードモードで遊ぶ"
        />
      </View>
    </Screen>
  );
}

interface ModeCardProps {
  mode: Mode;
  icon: "players" | "card";
  title: string;
  minLabel: string;
  tag: string;
  expanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
  rules: string[];
  playLabel: string;
}

function ModeCard(props: ModeCardProps) {
  return (
    <Card padded={false} elevation="card">
      <PressableScale haptic onPress={props.onToggle} style={styles.modeHead}>
        <View style={styles.modeHeadLeft}>
          <IconBadge icon={props.icon} box={64} size={34} />
          <View>
            <Text style={styles.modeTitle}>{props.title}</Text>
            <View style={styles.modeMeta}>
              <Text style={styles.modeMin}>{props.minLabel}</Text>
              <View style={styles.modeTag}>
                <Text style={styles.modeTagText}>{props.tag}</Text>
              </View>
            </View>
          </View>
        </View>
        <Icon name={props.expanded ? "back" : "forward"} size={22} color={colors.ink400} />
      </PressableScale>

      {props.expanded && (
        <Animated.View entering={FadeIn.duration(180)} style={styles.modeBody}>
          <View style={styles.rulesBox}>
            <View style={styles.rulesBoxHead}>
              <Icon name="rules" size={18} color={colors.ink800} />
              <Text style={styles.rulesBoxTitle}>ルール</Text>
            </View>
            {props.rules.map((r, i) => (
              <Text key={i} style={styles.ruleItem}>
                ・{r}
              </Text>
            ))}
          </View>
          <AppButton label={props.playLabel} icon="play" iconTrailing onPress={props.onPlay} />
        </Animated.View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: 22, fontWeight: "800", color: colors.ink800 },
  sub: { fontSize: 13, fontWeight: "700", color: colors.ink500 },
  modeHead: { padding: space["2xl"], flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modeHeadLeft: { flexDirection: "row", alignItems: "center", gap: space.lg, flexShrink: 1 },
  modeTitle: { fontSize: 20, fontWeight: "800", color: colors.ink800 },
  modeMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  modeMin: { fontSize: 12, fontWeight: "700", color: colors.ink500 },
  modeTag: { backgroundColor: colors.ink200, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  modeTagText: { fontSize: 11, fontWeight: "800", color: colors.ink600 },
  modeBody: { paddingHorizontal: space["2xl"], paddingBottom: space["2xl"], gap: space.lg },
  rulesBox: { backgroundColor: colors.ink50, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.ink200, gap: 6 },
  rulesBoxHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  rulesBoxTitle: { fontSize: 14, fontWeight: "800", color: colors.ink800 },
  ruleItem: { fontSize: 13, fontWeight: "700", color: colors.ink600, lineHeight: 20 },
});
