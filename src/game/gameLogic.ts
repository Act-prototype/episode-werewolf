import { Player, Role } from "./types";

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

export function checkGameOver(players: Player[]): "村人" | "人狼" | null {
  const alivePlayers = players.filter(p => p.isAlive);
  const aliveWerewolves = alivePlayers.filter(p => p.role === "人狼");
  const aliveVillagers = alivePlayers.filter(p => p.role === "村人");

  if (aliveWerewolves.length === 0) {
    return "村人";
  }

  if (aliveWerewolves.length >= aliveVillagers.length) {
    return "人狼";
  }

  return null;
}

export function eliminatePlayer(players: Player[], playerId: number): Player[] {
  return players.map(p =>
    p.id === playerId ? { ...p, isAlive: false } : p
  );
}
