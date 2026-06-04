export function getNextLevelXp(level: number): number {
  return level * 100
}

export function getXpProgress(xp: number, level: number): number {
  const next = getNextLevelXp(level)
  return Math.min(100, Math.round((xp / next) * 100))
}
