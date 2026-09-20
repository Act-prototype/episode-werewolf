import { GameState, Role } from "./types";

export function assignRoles(playerCount: number, werewolfCount: number): Role[] {
  const roles: Role[] = [];

  for (let i = 0; i < werewolfCount; i++) {
    roles.push("人狼");
  }

  for (let i = werewolfCount; i < playerCount; i++) {
    roles.push("村人");
  }

  // シャッフル
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  return roles;
}

/** 通常モードは1テーマ・1投票で決着する。再戦もここから全員で開始する。 */
export function createNormalGame({ playerNames, selectedTheme, customTopic }: {
  playerNames: string[]; selectedTheme: string; customTopic?: string;
}): GameState {
  if (playerNames.length < 3 || playerNames.length > 20) throw new Error("通常モードは3〜20人で遊べます。");
  return {
    rulesVersion: 2,
    players: playerNames.map((name, id) => ({ id, name: name || `プレイヤー${id + 1}`, role: null, isAlive: true, hasSeenRole: false, votes: 0 })),
    werewolfCount: 1,
    selectedTheme,
    customTopic,
    currentPhase: "roleReveal",
    currentDay: 1,
    currentTopic: null,
    accusedPlayerId: null,
    eliminatedTonight: null,
    votingResults: {},
    winner: null,
  };
}

/** nullは最多票が同票だった場合。生存状態を変えず、この投票で終了する。 */
export function resolveNormalRound(state: GameState, accusedPlayerId: number | null): GameState {
  if (state.rulesVersion !== 2 || state.currentPhase !== "voting") throw new Error("投票できる状態ではありません。");
  const accused = state.players.find((player) => player.id === accusedPlayerId);
  if (accusedPlayerId !== null && !accused) throw new Error("投票先が見つかりません。");
  if (state.players.some((player) => !player.role) || state.players.filter((player) => player.role === "人狼").length !== 1) {
    throw new Error("役職を確認してから投票してください。");
  }
  return { ...state, accusedPlayerId, currentPhase: "gameOver", winner: accused?.role === "人狼" ? "村人" : "人狼" };
}

/** OTA前の複数日ルールは、顔ぶれとテーマを保持して全員参加の新しい1戦へ移す。 */
export function normalizeNormalGame(value: unknown): GameState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as GameState;
  if (!Array.isArray(state.players) || state.players.length < 3 || state.players.length > 20 || typeof state.selectedTheme !== "string") return null;
  if (state.players.some((player) => !player || typeof player.name !== "string")) return null;
  const hasOneWolf = state.players.filter((player) => player.role === "人狼").length === 1
    && state.players.every((player) => player.role === "村人" || player.role === "人狼");
  const awaitingRoles = state.currentPhase === "roleReveal" && state.players.every((player) => player.role === null);
  const validPhase = ["roleReveal", "episodeAnnouncement", "episodeTime", "discussion", "voting", "gameOver"].includes(state.currentPhase);
  const validPlayers = state.players.every((player, index) => player.id === index && player.isAlive && typeof player.hasSeenRole === "boolean");
  const validResult = state.currentPhase !== "gameOver" || (
    state.winner === (state.players.find((player) => player.id === state.accusedPlayerId)?.role === "人狼" ? "村人" : "人狼")
    && (state.accusedPlayerId === null || state.players.some((player) => player.id === state.accusedPlayerId))
  );
  if (state.rulesVersion === 2 && state.werewolfCount === 1 && validPhase && validPlayers && validResult && (hasOneWolf || awaitingRoles)) return state;
  return createNormalGame({ playerNames: state.players.map((player) => player.name), selectedTheme: state.selectedTheme, customTopic: typeof state.customTopic === "string" ? state.customTopic : undefined });
}
