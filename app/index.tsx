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
import { colors, radius, space, type, sizing } from "@/theme/tokens";

type Mode = "normal" | "card";

export default function ModeSelection() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Mode | null>("normal");

  return (
    <Screen scroll background={colors.ink50} edges={{ top: false, bottom: true }} contentContainerStyle={{ paddingBottom: space["2xl"] }}>
      <Header icon="wolf" title="エピソード人狼" subtitle="EPISODE WEREWOLF" center />

      <View style={styles.body}>
        <Text style={styles.lead}>遊び方を選ぶ</Text>

        <ModeCard
          icon="players"
          title="通常モード"
          minLabel="3人以上"
          tag="大人数向け"
          summary="役職を配り、議論と投票で人狼を探す王道ルール。"
          expanded={expanded === "normal"}
          onToggle={() => setExpanded(expanded === "normal" ? null : "normal")}
          onPlay={() => router.push("/setup-normal")}
          flow={["テーマに沿ってエピソードを話す", "全員で議論する", "投票で人狼を1人追放", "勝敗がつくまで繰り返す"]}
          playLabel="通常モードで遊ぶ"
        />

        <ModeCard
          icon="card"
          title="カードモード"
          minLabel="2人以上"
          tag="少人数でも"
          summary="配られたカードの指示で話し、嘘を「ダウト」で見破る。"
          expanded={expanded === "card"}
          onToggle={() => setExpanded(expanded === "card" ? null : "card")}
          onPlay={() => router.push("/setup-card")}
          flow={["カードを1枚選んで話す", "怪しい人をダウトする", "外したら自分に+1枚", "先に手札を使い切れば勝ち"]}
          playLabel="カードモードで遊ぶ"
        />
      </View>
    </Screen>
  );
}

interface ModeCardProps {
  icon: "players" | "card";
  title: string;
  minLabel: string;
  tag: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
  flow: string[];
  playLabel: string;
}

function ModeCard(props: ModeCardProps) {
  return (
    <Card padded={false} elevation="card">
      <PressableScale haptic onPress={props.onToggle} style={styles.head}>
        <IconBadge icon={props.icon} box={sizing.heroIcon} size={28} />
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{props.title}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{props.tag}</Text>
            </View>
          </View>
          <Text style={styles.minLabel}>{props.minLabel}</Text>
        </View>
        <Icon name={props.expanded ? "expandLess" : "expandMore"} size={24} color={colors.ink400} />
      </PressableScale>

      {props.expanded && (
        <Animated.View entering={FadeIn.duration(160)} style={styles.bodyExpand}>
          <Text style={styles.summary}>{props.summary}</Text>

          <View style={styles.flow}>
            {props.flow.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <AppButton label={props.playLabel} icon="play" iconTrailing onPress={props.onPlay} />
        </Animated.View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.xl, gap: space.md },
  lead: { ...type.h1, color: colors.ink800, marginBottom: space.xs },

  head: { padding: space.lg, flexDirection: "row", alignItems: "center", gap: space.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  title: { ...type.h2, color: colors.ink800 },
  tag: { backgroundColor: colors.ink100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  tagText: { ...type.caption, fontWeight: "800", color: colors.ink500, letterSpacing: 0 },
  minLabel: { ...type.small, fontWeight: "700", color: colors.ink500, marginTop: 2 },

  bodyExpand: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.lg },
  summary: { ...type.body, color: colors.ink600, lineHeight: 21 },
  flow: { gap: space.sm },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  stepNum: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.ink900, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  stepText: { ...type.body, color: colors.ink700, flex: 1 },
});
