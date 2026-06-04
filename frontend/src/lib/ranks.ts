import type { Rank } from '../types'

export function getTierForLevel(level: number): number {
  if (level >= 50) return 5
  if (level >= 30) return 4
  if (level >= 15) return 3
  if (level >= 5) return 2
  return 1
}

export function findRank(level: number, ranks: Rank[]): Rank | null {
  let best: Rank | null = null
  for (const r of ranks) {
    if (level >= r.level) best = r
  }
  return best
}
