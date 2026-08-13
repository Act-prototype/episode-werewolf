import { Image, StyleSheet } from "react-native";
import { sketch } from "@/theme/sketchAssets";

/**
 * 紙のテクスチャ。画面全体の背面に敷く。
 * 地色は tokens.colors.paper と同系なので、読み込み前もちらつかない。
 */
export function PaperBackground() {
  return <Image source={sketch.paper} style={styles.fill} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  // absoluteFill だけだと react-native-web で画像の実寸（786px）に広がり
  // ページ全体を横に押し出すため、幅と高さを明示する。
  fill: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
});
