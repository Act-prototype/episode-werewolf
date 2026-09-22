import { View, Text, StyleSheet } from "react-native";
import { Player } from "@/game/types";
import { RoleArt } from "./sketch/RoleArt";
import { LossGlasses } from "./LossGlasses";
import { colors, space, type } from "@/theme/tokens";

/**
 * 勝敗発表の2列グリッド。役職イラストとプレイヤー名を並べる。
 *
 * イラストは役職ごとに縦横比が違う（チワワ0.69・ポメ0.99）ので、枠の寸法は
 * 揃えたうえで fill（contain）で内側に収める。横長の絵ほど小さく収まる。
 */
export function ResultGrid({ players, points, lost = false, ranks }: { players: Player[]; points: number[]; lost?: boolean; ranks?: Record<number, string> }) {
  return (
    <View style={styles.resultGrid}>
      {players.map((p) => (
        <View key={p.id} style={styles.resultCard}>
          {ranks?.[p.id] && <Text style={styles.rank}>{ranks[p.id]}</Text>}
          <View style={styles.resultCardBox}>
            <RoleArt role={p.role ?? "村人"} fill variant={p.id} />
          </View>
          <Text style={styles.resultCardName}>
            {p.name}
          </Text>
          <LossGlasses points={points[p.id]} added={lost} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  resultGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    // モック実測の間隔55ptに合わせる（トークンの40では詰まりすぎる）
    columnGap: 55,
    rowGap: space.xl,
  },
  // 34%は枠内側313ptに対し106pt。モック実測の107ptと一致する
  resultCard: { width: "34%", alignItems: "center", gap: space.md },
  // 枠はモック実測（107x132pt・線幅1.25pt）。手書き素材ではなく均一な細線
  resultCardBox: {
    width: "100%",
    aspectRatio: 107 / 132,
    borderWidth: 1.25,
    borderColor: colors.ink,
    padding: space.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  resultCardName: { ...type.small, color: colors.ink, textAlign: "center" },

  rank: { ...type.small, color: colors.inkSub, textAlign: "center" },
});
