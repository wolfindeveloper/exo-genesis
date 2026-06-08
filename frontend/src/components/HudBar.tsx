import { useCallback } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { useCountUp } from '../hooks/useCountUp'
import { getXpProgress } from '../lib/xp'
import { getTierForLevel, findRank } from '../lib/ranks'
import { getAvatarUrl, getFirstName } from '../lib/telegram'
import { useGameStore } from '../store/game'

const tierColors = ['#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']

export function HudBar() {
  const navigate = useNavigate()
  const user = useGameStore((s) => s.user)
  const ranksContent = useGameStore((s) => s.ranksContent)

  const avatarUrl = getAvatarUrl()
  const first = getFirstName()

  const level = user?.level ?? 1
  const xp = user?.xp ?? 0
  const xpPct = getXpProgress(xp, level)
  const tier = getTierForLevel(level)
  const rank = findRank(level, ranksContent)

  const xgenCount = useCountUp(user?.balance_xgen ?? 0, 800, true)

  const handleAvatarClick = useCallback(() => {
    navigate('/profile')
  }, [navigate])

  if (!user) return null

  return (
    <motion.header
      className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={handleAvatarClick}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple shrink-0 overflow-hidden transition-transform active:scale-95"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-display text-white">
            {(first || '?')[0]}
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-display truncate text-slate-200">
            {user.username || first || 'Капитан'}
          </span>
          {rank && (
            <span
              className="shrink-0 text-[8px] font-mono px-1.5 py-0.5 rounded-full border leading-tight"
              style={{
                borderColor: `${tierColors[tier - 1]}44`,
                color: tierColors[tier - 1],
                backgroundColor: `${tierColors[tier - 1]}12`,
              }}
            >
              {rank.title_key}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-space-600 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${tierColors[tier - 1]}, ${tierColors[Math.min(tier, 4)] || '#a855f7'})`,
                boxShadow: `0 0 6px ${tierColors[tier - 1]}44`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>

      <span className="text-[11px] text-neon-cyan font-mono tabular-nums shrink-0">
        🔷{xgenCount}
      </span>
      <span className="text-[11px] text-amber-400/80 font-mono tabular-nums shrink-0">
        📜{user?.balance_fragments ?? 0}
      </span>
    </motion.header>
  )
}
