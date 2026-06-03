import { useCallback } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { useCountUp } from '../hooks/useCountUp'
import { useGameStore } from '../store/game'
import type { Rank } from '../types'

const tierColors = ['#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']

function getTierForLevel(level: number): number {
  if (level >= 50) return 5
  if (level >= 30) return 4
  if (level >= 15) return 3
  if (level >= 5) return 2
  return 1
}

function findRank(level: number, ranks: Rank[]): Rank | null {
  let best: Rank | null = null
  for (const r of ranks) {
    if (level >= r.level) best = r
  }
  return best
}

export function HudBar() {
  const navigate = useNavigate()
  const user = useGameStore((s) => s.user)
  const pendingClaims = useGameStore((s) => s.pendingClaims)
  const ranksContent = useGameStore((s) => s.ranksContent)

  const tg = (window as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { photo_url?: string; first_name?: string } } } } }).Telegram?.WebApp
  const avatarUrl = tg?.initDataUnsafe?.user?.photo_url
  const first = tg?.initDataUnsafe?.user?.first_name

  const level = user?.level ?? 1
  const xp = user?.xp ?? 0
  const nextXp = level * 100
  const xpPct = Math.min(100, Math.round((xp / nextXp) * 100))
  const tier = getTierForLevel(level)
  const rank = findRank(level, ranksContent)

  const xgenCount = useCountUp(user?.balance_xgen ?? 0, 800, true)
  const pendingCount = pendingClaims.length
  const hasPending = pendingCount > 0

  const handleAvatarClick = useCallback(() => {
    navigate('/profile')
  }, [navigate])

  const handleClaimsClick = useCallback(() => {
    navigate('/')
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

      {hasPending && (
        <motion.button
          onClick={handleClaimsClick}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-neon-green/15 border border-neon-green/25 text-[10px] font-mono text-neon-green shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎁
          </motion.span>
          {pendingCount}
        </motion.button>
      )}

      <span className="text-[11px] text-neon-cyan font-mono tabular-nums shrink-0">
        🔷{xgenCount}
      </span>
      <span className="text-[11px] text-amber-400/80 font-mono tabular-nums shrink-0">
        📜{user?.balance_fragments ?? 0}
      </span>
    </motion.header>
  )
}
