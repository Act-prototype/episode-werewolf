import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "./types";

/**
 * Web版の localStorage("gameState" / "cardState") を AsyncStorage に置き換えたもの。
 * 画面間の状態受け渡しに使う（端末を回して遊ぶローカルゲームのため、永続化＝進行状況の保持）。
 */

const GAME_KEY = "gameState";
const CARD_KEY = "cardState";
const NORMAL_SETUP_KEY = "normalSetup";

/**
 * ノーマルモードの設定画面の内容。
 *
 * 進行中の状態(gameState)とは別に持つ。ゲームが終わっても設定は残したいが、
 * gameState を残すと再開扱いになってしまうため。
 */
export interface NormalSetup {
  playerCount: number;
  werewolfCount: number;
  selectedTheme: string;
  names: string[];
}

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

export async function saveNormalSetup(setup: NormalSetup): Promise<void> {
  await AsyncStorage.setItem(NORMAL_SETUP_KEY, JSON.stringify(setup));
}

export async function loadNormalSetup(): Promise<NormalSetup | null> {
  const raw = await AsyncStorage.getItem(NORMAL_SETUP_KEY);
  return raw ? (JSON.parse(raw) as NormalSetup) : null;
}

/**
 * 進行中の状態だけを消す。normalSetup は意図的に残す。
 * 顔ぶれは複数回の対戦をまたいで変わらないことが多く、やめるたびに
 * 名前を入れ直させたくないため。
 */
export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([GAME_KEY, CARD_KEY]);
}
