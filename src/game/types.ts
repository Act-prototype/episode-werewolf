export type Role = "村人" | "人狼";

export type GamePhase =
  | "setup"
  | "roleReveal"
  | "episodeAnnouncement"
  | "episodeTime"
  | "discussion"
  | "voting"
  | "voteResult"
  | "night"
  | "gameOver"
  | "sessionSummary";

export interface Player {
  id: number;
  name: string;
  role: Role | null;
  isAlive: boolean;
  hasSeenRole: boolean;
  votes: number;
}

export interface EpisodeTopic {
  category: string;
  topic: string;
}

export interface NormalSession {
  completedRounds: number;
  /** プレイヤーID（同名でも別人）を添字とする累計の負けポイント。 */
  lossPoints: number[];
}

export interface GameState {
  session: NormalSession;
  rulesVersion: 2;
  accusedPlayerId: number | null;
  players: Player[];
  werewolfCount: number;
  selectedTheme: string;
  customTopic?: string;
  currentPhase: GamePhase;
  currentDay: number;
  currentTopic: EpisodeTopic | null;
  eliminatedTonight: number | null;
  votingResults: { [playerId: number]: number[] };
  winner: "村人" | "人狼" | null;
}
