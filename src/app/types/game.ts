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
  | "gameOver";

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

export interface GameState {
  players: Player[];
  werewolfCount: number;
  selectedTheme: string;
  currentPhase: GamePhase;
  currentDay: number;
  currentTopic: EpisodeTopic | null;
  eliminatedTonight: number | null;
  votingResults: { [playerId: number]: number[] };
  winner: "村人" | "人狼" | null;
}
