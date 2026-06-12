import { ReactNode } from "react";
import { View, ScrollView, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, LAYOUT_MAX_WIDTH } from "@/theme/tokens";

interface ScreenProps {
  children: ReactNode;
  /** 背景色（既定はグレーのサーフェス） */
  background?: string;
  /** スクロール可能にするか（既定 false=固定レイアウト） */
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** セーフエリア下部に余白を足すか */
  edges?: { top?: boolean; bottom?: boolean };
}

/**
 * 全画面共通の枠。
 * - セーフエリア対応（ノッチ/ホームインジケータ）
 * - タブレット/Web では中央寄せ・最大幅 480px（Web版 max-w-[420px] の発展）
 */
export function Screen({
  children,
  background = colors.ink50,
  scroll = false,
  contentContainerStyle,
  edges = { top: true, bottom: true },
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edges.top ? insets.top : 0,
    paddingBottom: edges.bottom ? insets.bottom : 0,
  };

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <View style={[styles.frame, { backgroundColor: background }]}>
        {scroll ? (
          <ScrollView
            style={pad}
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, pad]}>{children}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  frame: { flex: 1, width: "100%", maxWidth: LAYOUT_MAX_WIDTH },
  fill: { flex: 1 },
});
