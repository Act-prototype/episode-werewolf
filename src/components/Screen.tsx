import { ReactNode } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, LAYOUT_MAX_WIDTH } from "@/theme/tokens";

interface ScreenProps {
  children: ReactNode;
  background?: string;
  /** スクロール可能にするか（既定 false=固定レイアウト） */
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: { top?: boolean; bottom?: boolean };
  /** キーボード回避を有効にするか（入力欄を持つ画面で true） */
  avoidKeyboard?: boolean;
}

/**
 * 全画面共通の枠。
 * - セーフエリア対応
 * - タブレット/Web は中央寄せ・最大幅
 * - avoidKeyboard でソフトキーボードと入力欄の重なりを防ぐ
 */
export function Screen({
  children,
  background = colors.ink50,
  scroll = false,
  contentContainerStyle,
  edges = { top: true, bottom: true },
  avoidKeyboard = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edges.top ? insets.top : 0,
    paddingBottom: edges.bottom ? insets.bottom : 0,
  };

  const inner = scroll ? (
    <ScrollView
      style={pad}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={avoidKeyboard}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, pad]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <View style={[styles.frame, { backgroundColor: background }]}>
        {avoidKeyboard ? (
          <KeyboardAvoidingView
            style={styles.fill}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {inner}
          </KeyboardAvoidingView>
        ) : (
          inner
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
