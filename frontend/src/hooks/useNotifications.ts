import { useEffect, useState } from 'react'

import { useGameStore } from '../store/game'

export function useNotifications() {
  const [now, setNow] = useState(Date.now())
  const activeExpeditions = useGameStore((s) => s.activeExpeditions)
  const guideChapters = useGameStore((s) => s.guideChapters)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  const hasCompletedExpedition = activeExpeditions.some(
    (e) => e.status === 'active' && new Date(e.end_time).getTime() <= now,
  )

  let hasUnlockedGuideEntry = false
  let hasUnclaimedReward = false

  for (const ch of guideChapters) {
    if (!hasUnclaimedReward && ch.all_researched && !ch.reward_claimed) {
      hasUnclaimedReward = true
    }
    if (!hasUnlockedGuideEntry && ch.entries) {
      for (const entry of ch.entries) {
        if (entry.has_event && entry.status === 'locked') {
          hasUnlockedGuideEntry = true
          break
        }
      }
    }
    if (hasUnlockedGuideEntry && hasUnclaimedReward) break
  }

  return { hasCompletedExpedition, hasUnlockedGuideEntry, hasUnclaimedReward }
}
