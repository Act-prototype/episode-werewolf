import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { haptics } from "@/components/haptics";
import { colors, fontFamily, space, type } from "@/theme/tokens";

/**
 * タイトル画面。画面のどこを触ってもモード選択へ進む。
 *
 * 絵は画面下端に幅いっぱいで置く（モックでは画面のちょうど下半分）。
 * 上半分は余白比で組んであり、縦の短い端末でも詰まるだけで崩れない。
 */
export default function Title() {
  const router = useRouter();

  const start = () => {
    haptics.select();
    router.push("/mode-select");
  };

  return (
    <Screen scroll={false} edges={{ top: true, bottom: false }}>
      <Pressable style={styles.fill} onPress={start} accessibilityRole="button">
        <Animated.View entering={FadeIn.duration(400)} style={styles.fill}>
          <View style={styles.upper}>
            <View style={styles.spacerTop} />

            <Text style={styles.title}>エピソード人狼</Text>
            <Text style={styles.tagline}>〜この中に猫のふりをした犬がいる〜</Text>

            <View style={styles.spacerMid} />
            <Text style={styles.tap}>TAP to START</Text>
          </View>

          <Image
            source={require("../assets/app_board.png")}
            style={styles.board}
            resizeMode="contain"
          />
        </Animated.View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  upper: { flex: 1, alignItems: "center", paddingHorizontal: space.xl },
  // モック実測の余白比（セーフエリア下から見出しまで117pt : 説明からTAPまで129pt）
  spacerTop: { flex: 0.9 },
  spacerMid: { flex: 1 },

  // 見出しはモック実測で字面の高さ40pt・全幅319pt。字送りは他のトークンと同じ 4%
  title: { fontFamily: fontFamily.jp, fontSize: 44, letterSpacing: 1.76, color: colors.ink },
  tagline: { ...type.small, color: colors.ink, marginTop: space.sm },

  tap: { ...type.displaySm, color: colors.inkSub, marginBottom: 36 },

  // 400x436 の素材を幅いっぱいに。画面下端に接地させる
  board: { width: "100%", aspectRatio: 400 / 436 },
});
