import { Platform } from "react-native";

/**
 * AIテーマ生成APIのベースURL。
 * - Web: 同一オリジン（server/server.js が静的配信 + API を兼ねる想定）
 * - ネイティブ(iOS/Android): Railway 上の本番APIを直接叩く
 */
const PRODUCTION_API = "https://episode-werewolf-production.up.railway.app";

export function getApiBaseUrl(): string {
  if (Platform.OS === "web") {
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname.includes("railway.app"))
    ) {
      return "";
    }
    return "";
  }
  return PRODUCTION_API;
}
