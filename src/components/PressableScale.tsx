import { ReactNode } from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { haptics } from "./haptics";

interface Props extends Omit<PressableProps, "style"> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 押下時の縮小率（Web版の active:scale-95 相当） */
  scaleTo?: number;
  /** タップ時に軽い触覚を出す（既定 true） */
  haptic?: boolean;
}

/**
 * 押すとわずかに沈むネイティブ然としたタッチ反応 + 触覚。
 * Web版の `active:scale-95 transition-all` をネイティブで再現する基礎部品。
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  haptic = true,
  onPressIn,
  onPress,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={(e) => {
        if (haptic && !disabled) haptics.tap();
        onPress?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, animStyle, disabled && { opacity: 0.45 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
