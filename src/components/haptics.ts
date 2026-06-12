import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * 触覚フィードバックの薄いラッパー。
 * Web では no-op（expo-haptics は Web で例外を投げないが、明示的に無効化）。
 */
const enabled = Platform.OS !== "web";

export const haptics = {
  /** ボタン等の軽いタップ */
  tap() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** 選択トグル */
  select() {
    if (enabled) Haptics.selectionAsync();
  },
  /** 役職めくり・カード公開など重めの確定 */
  reveal() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  success() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning() {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
};
