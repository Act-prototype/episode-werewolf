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
    session: { completedRounds: 0, lossPoints: playerNames.map(() => 0) },
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

/** nullは追放なし。同票では勝敗も加点も確定せず、配役を保持する。 */
export function resolveNormalRound(state: GameState, accusedPlayerId: number | null): GameState {
  if (state.rulesVersion !== 2 || state.currentPhase !== "voting") throw new Error("投票できる状態ではありません。");
  const accused = state.players.find((player) => player.id === accusedPlayerId);
  if (accusedPlayerId !== null && !accused) throw new Error("投票先が見つかりません。");
  if (state.players.some((player) => !player.role) || state.players.filter((player) => player.role === "人狼").length !== 1) {
    throw new Error("役職を確認してから投票してください。");
  }
  if (accusedPlayerId === null) return { ...state, accusedPlayerId: null, winner: null, currentPhase: "peacefulMorning" };
  const winner: Role = accused?.role === "人狼" ? "村人" : "人狼";
  // 勝敗とポイントを同じ保存データで確定する。画面再表示では加算しない。
  const session = {
    completedRounds: state.session.completedRounds + 1,
    lossPoints: state.players.map((player) => state.session.lossPoints[player.id] + (player.role !== winner ? 1 : 0)),
  };
  return { ...state, accusedPlayerId, currentPhase: "voteResult", winner, session };
}

/** 正体の発表後に勝敗画面へ。加点済みの結果をそのまま引き継ぐ。 */
export function showNormalRoundResult(state: GameState): GameState {
  if (state.currentPhase !== "voteResult" || !state.winner) throw new Error("正体発表を確認してください。");
  return { ...state, currentPhase: "gameOver" };
}

/** 追放なしの朝は同じ配役・累計で次のお題へ進む。 */
export function continueNormalAfterDraw(state: GameState): GameState {
  if (state.currentPhase !== "peacefulMorning") throw new Error("追放なしの結果ではありません。");
  return { ...state, currentPhase: "episodeAnnouncement", currentDay: state.currentDay + 1, currentTopic: null };
}

/** 全体集計からの再スタートは、同じ名前・テーマで0杯の新しい集計を作る。 */
export function restartNormalSession(state: GameState): GameState {
  if (state.currentPhase !== "sessionSummary") throw new Error("全体集計を確認してください。");
  return createNormalGame({ playerNames: state.players.map(p => p.name), selectedTheme: state.selectedTheme, customTopic: state.customTopic });
}

/** 同じ顔ぶれの再戦はポイントを保ち、役だけを引き直す。 */
export function replayNormalGame(state: GameState): GameState {
  if (state.currentPhase !== "gameOver" && state.currentPhase !== "sessionSummary") throw new Error("結果を確認してから再戦してください。");
  return {
    ...createNormalGame({ playerNames: state.players.map((p) => p.name), selectedTheme: state.selectedTheme, customTopic: state.customTopic }),
    session: { completedRounds: state.session.completedRounds, lossPoints: [...state.session.lossPoints] },
  };
}

/** 未確定のゲームは加点せず、ここまでの集計を保存する。 */
export function finishNormalSession(state: GameState): GameState {
  return { ...state, currentPhase: "sessionSummary" };
}

export function getNormalStandings(state: GameState) {
  const rows = state.players.map((p) => ({ id: p.id, name: p.name, points: state.session.lossPoints[p.id] }))
    .sort((a, b) => a.points - b.points || a.id - b.id);
  return rows.map((row) => ({
    ...row,
    rank: rows.findIndex((other) => other.points === row.points) + 1,
    tied: rows.filter((other) => other.points === row.points).length > 1,
  }));
}

function normalizeSession(state: GameState): GameState {
  const session = state.session;
  const valid = session && Number.isSafeInteger(session.completedRounds) && session.completedRounds >= 0
    && Array.isArray(session.lossPoints) && session.lossPoints.length === state.players.length
    && session.lossPoints.every((points) => Number.isSafeInteger(points) && points >= 0 && points <= session.completedRounds)
    && (!["gameOver", "voteResult"].includes(state.currentPhase) || session.completedRounds > 0);
  if (valid) return state;
  // ポイント導入前は履歴がない。保存されている直近の確定結果だけを集計する。
  const finished = ["gameOver", "voteResult"].includes(state.currentPhase);
  return { ...state, session: {
    completedRounds: finished ? 1 : 0,
    lossPoints: state.players.map((player) => finished && player.role !== state.winner ? 1 : 0),
  } };
}

/** OTA前の複数日ルールは、顔ぶれとテーマを保持して全員参加の新しい1戦へ移す。 */
export function normalizeNormalGame(value: unknown): GameState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as GameState;
  if (!Array.isArray(state.players) || state.players.length < 3 || state.players.length > 20 || typeof state.selectedTheme !== "string") return null;
  if (state.players.some((player) => !player || typeof player.name !== "string")) return null;
  const hasOneWolf = state.players.filter((player) => player.role === "人狼").length === 1
    && state.players.every((player) => player.role === "村人" || player.role === "人狼");
  const awaitingRoles = ["roleReveal", "sessionSummary"].includes(state.currentPhase) && state.players.every((player) => player.role === null);
  const validPhase = ["roleReveal", "episodeAnnouncement", "episodeTime", "discussion", "voting", "voteResult", "peacefulMorning", "gameOver", "sessionSummary"].includes(state.currentPhase);
  const validPlayers = state.players.every((player, index) => player.id === index && player.isAlive && typeof player.hasSeenRole === "boolean");
  const validResult = (!["gameOver", "voteResult"].includes(state.currentPhase) || (
    state.winner === (state.players.find((player) => player.id === state.accusedPlayerId)?.role === "人狼" ? "村人" : "人狼")
    && (state.accusedPlayerId === null || state.players.some((player) => player.id === state.accusedPlayerId))
  )) && (state.currentPhase !== "voteResult" || state.accusedPlayerId !== null)
    && (state.currentPhase !== "peacefulMorning" || (state.accusedPlayerId === null && state.winner === null));
  if (state.rulesVersion === 2 && state.werewolfCount === 1 && validPhase && validPlayers && validResult && (hasOneWolf || awaitingRoles)) return normalizeSession(state);
  return createNormalGame({ playerNames: state.players.map((player) => player.name), selectedTheme: state.selectedTheme, customTopic: typeof state.customTopic === "string" ? state.customTopic : undefined });
}
