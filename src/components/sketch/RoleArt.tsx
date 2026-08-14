import { Image, StyleProp, ImageStyle } from "react-native";
import { sketchRoleArt } from "@/theme/sketchAssets";

export type Role = keyof typeof sketchRoleArt;

interface Props {
  role: Role;
  /** 描画する高さ。縦横比は素材に従う（絵ごとに違う）。fill 指定時は不要 */
  size?: number;
  /**
   * 親の内側いっぱいに収める。枠の中に置く用途で使う。
   * contain なので縦横比は保たれ、横長の絵ほど小さく収まる。
   */
  fill?: boolean;
  /**
   * どの絵を使うかを決める種。プレイヤーIDなど「同じ人なら常に同じ値」を渡す。
   * 乱数を使うと再描画ごとに絵が変わってしまう。省略時は先頭の絵。
   */
  variant?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * 役職の手書きイラスト。人狼はチワワ、村人はポメラニアン／ラグドール／
 * スコティッシュフォールドの3種から振り分ける。
 *
 * シルエットの差が大きいため22pt程度まで縮めても役職は判別できる。
 */
export function RoleArt({ role, size, fill, variant = 0, style }: Props) {
  const pool = sketchRoleArt[role];
  // 負値や小数が来ても必ずプール内に収める
  const index = ((Math.trunc(variant) % pool.length) + pool.length) % pool.length;
  const art = pool[index];

  const dims: ImageStyle = fill
    ? { width: "100%", height: "100%" }
    : {
        height: size,
        width: size === undefined ? undefined : (size * art.width) / art.height,
      };

  return <Image source={art.source} style={[dims, style]} resizeMode="contain" />;
}

/** カードモードのカード種別（werewolf/villager）を役職名に寄せる */
export const roleFromCardType = (cardType: "werewolf" | "villager"): Role =>
  cardType === "werewolf" ? "人狼" : "村人";
