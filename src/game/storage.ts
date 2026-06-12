import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "./types";

/**
 * Web版の localStorage("gameState" / "cardState") を AsyncStorage に置き換えたもの。
 * 画面間の状態受け渡しに使う（端末を回して遊ぶローカルゲームのため、永続化＝進行状況の保持）。
 */

const GAME_KEY = "gameState";
const CARD_KEY = "cardState";

export interface CardGameState {
  playerNames: string[];
  cardsPerPlayer: number;
  werewolfCardCount: number;
  selectedTheme: string;
  currentPlayer: number;
  currentRound: number;
  winner: string | null;
}

export async function saveGameState(state: GameState): Promise<void> {
  await AsyncStorage.setItem(GAME_KEY, JSON.stringify(state));
}

export async function loadGameState(): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(GAME_KEY);
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export async function clearGameState(): Promise<void> {
  await AsyncStorage.removeItem(GAME_KEY);
}

export async function saveCardState(state: CardGameState): Promise<void> {
  await AsyncStorage.setItem(CARD_KEY, JSON.stringify(state));
}

export async function loadCardState(): Promise<CardGameState | null> {
  const raw = await AsyncStorage.getItem(CARD_KEY);
  return raw ? (JSON.parse(raw) as CardGameState) : null;
}

export async function clearCardState(): Promise<void> {
  await AsyncStorage.removeItem(CARD_KEY);
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([GAME_KEY, CARD_KEY]);
}
