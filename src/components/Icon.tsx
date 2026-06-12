import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

/**
 * アプリ全体のアイコン言語を一元管理する。
 * 絵文字は使わず Google の Material Icons を基本とし、
 * Material Icons に字形が無いもの（仮面・トランプ・ドクロ）のみ
 * 同デザイン体系の MaterialCommunityIcons で補う。
 *
 * 画面側は意味名（"wolf" / "villager" 等）で参照し、字形の差し替えはここだけで完結させる。
 */

type MI = keyof typeof MaterialIcons.glyphMap;
type MCI = keyof typeof MaterialCommunityIcons.glyphMap;

const MATERIAL: Record<string, MI> = {
  villager: "person",
  players: "groups",
  theme: "auto-awesome",
  shuffle: "shuffle",
  add: "add",
  remove: "remove",
  back: "arrow-back",
  forward: "arrow-forward",
  menu: "menu",
  close: "close",
  home: "home",
  rules: "menu-book",
  alert: "error-outline",
  hide: "visibility-off",
  show: "visibility",
  day: "wb-sunny",
  night: "dark-mode",
  discussion: "forum",
  vote: "how-to-vote",
  play: "sports-esports",
  refresh: "refresh",
  expandMore: "expand-more",
  expandLess: "expand-less",
  arrowRightSmall: "chevron-right",
  trophy: "emoji-events",
  target: "gps-fixed",
  success: "check-circle",
  fail: "cancel",
  balance: "balance",
  handshake: "handshake",
  thinking: "psychology",
  celebrate: "celebration",
  check: "check",
};

const COMMUNITY: Record<string, MCI> = {
  wolf: "domino-mask", // 人狼=正体を隠す仮面
  acting: "drama-masks",
  card: "cards-playing-outline",
  cardBack: "cards",
  skull: "skull",
};

export type IconName = keyof typeof MATERIAL | keyof typeof COMMUNITY;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = colors.ink800 }: IconProps) {
  if (name in COMMUNITY) {
    return (
      <MaterialCommunityIcons
        name={COMMUNITY[name as keyof typeof COMMUNITY]}
        size={size}
        color={color}
      />
    );
  }
  return (
    <MaterialIcons
      name={MATERIAL[name as keyof typeof MATERIAL]}
      size={size}
      color={color}
    />
  );
}
