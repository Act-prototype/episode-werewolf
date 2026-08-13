import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { ZenKakuGothicNew_500Medium } from "@expo-google-fonts/zen-kaku-gothic-new";
import { colors } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  /**
   * 本文（日本語）・英字見出し・情景の語り（明朝）の3書体。
   *
   * 英字と明朝は使う文字が限られるので scripts/subset-fonts.py で絞った
   * ローカルのttfを読む（Hina Mincho は 6.3MB→11KB、Readex Pro は 97KB→18KB）。
   * Zen Kaku はプレイヤー名やAI生成のお題に任意の文字が来るため絞らない。
   */
  const [fontsLoaded, fontError] = useFonts({
    ZenKakuGothicNew_500Medium,
    ReadexPro_300Light: require("../assets/fonts/ReadexPro_300Light.subset.ttf"),
    HinaMincho_400Regular: require("../assets/fonts/HinaMincho_400Regular.subset.ttf"),
  });

  useEffect(() => {
    // フォント読込の完了（または失敗）を待ってからスプラッシュを閉じる。
    // 失敗時もシステムフォントで表示を続けるため、閉じないままにはしない。
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="setup-normal" />
          <Stack.Screen name="setup-card" />
          <Stack.Screen name="role-reveal" options={{ gestureEnabled: false }} />
          <Stack.Screen name="game" options={{ gestureEnabled: false }} />
          <Stack.Screen name="card-game" options={{ gestureEnabled: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
