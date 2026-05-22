import { motion } from 'motion/react'

import { useGameStore } from '../store/game'

export function HudBar() {
  const user = useGameStore((s) => s.user)

  if (!user) return null

  const tg = (window as any).Telegram?.WebApp
  const avatarUrl = tg?.initDataUnsafe?.user?.photo_url
  const first = tg?.initDataUnsafe?.user?.first_name

  const level = user.level || 1
  const xp = user.xp || 0
  const nextXp = level * 100
  const xpPct = Math.min(100, Math.round((xp / nextXp) * 100))

  return (
    <motion.header
      className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex-shrink-0 overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-display text-white">
            {(first || '?')[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-display truncate text-slate-200">
            {user.username || first || 'Капитан'}
          </span>
          <span className="text-[10px] font-display text-slate-500 uppercase tracking-wider">
            Lv.{level}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 bg-space-600 rounded-full overflow-hidden max-w-24">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <span className="text-[10px] text-neon-cyan font-display">
            🔷{user.balance_xgen || 0}
          </span>
        </div>
      </div>
    </motion.header>
  )
}
