import { useEffect } from 'react'
import { motion } from 'motion/react'

import { fadeIn, staggerContainer, xpBarVariants } from '../lib/animations'
import { useGameStore } from '../store/game'

export function Profile() {
  const { user, stats, loadProfile, loadStats } = useGameStore()

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [])

  if (!user) return <div className="p-4 pb-28"><div className="shimmer rounded-xl h-40" /></div>

  const level = user.level || 1
  const xp = user.xp || 0
  const nextLevelXp = level * 100
  const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100))

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-cyan">Профиль</h1>
        <p className="text-xs text-slate-500 mt-1">{user.username || 'Без имени'}</p>
      </motion.header>

      {/* Level & XP */}
      <motion.div
        className="glass-card p-5 mb-4"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center font-display text-lg">
              {level}
            </div>
            <div>
              <p className="font-display text-sm uppercase tracking-wider">Уровень {level}</p>
              <p className="text-[10px] text-slate-500">{xp} / {nextLevelXp} XP</p>
            </div>
          </div>
        </div>

        <div className="h-2 bg-space-500 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple"
            custom={xpPercent}
            variants={xpBarVariants}
            initial="hidden"
            animate="visible"
          />
        </div>

        <motion.div
          className="grid grid-cols-3 gap-3 mt-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <BalanceCard label="Стреак" value={`${user.streak_days || 0}д`} icon="🔥" />
          <BalanceCard label="Stars" value={user.balance_stars || 0} icon="⭐" />
          <BalanceCard label="XGEN" value={user.balance_xgen || 0} icon="🔷" />
        </motion.div>
      </motion.div>

      {/* Stats */}
      <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-3">Статистика</h2>
      <motion.div
        className="grid grid-cols-2 gap-3 mb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard label="Экспедиций" value={stats?.total_expeditions ?? '-'} icon="🚀" />
        <StatCard label="Завершено" value={stats?.completed_expeditions ?? '-'} icon="✅" />
        <StatCard label="Провалено" value={stats?.failed_expeditions ?? '-'} icon="💥" />
        <StatCard label="Артефактов" value={stats?.artifacts_crafted ?? '-'} icon="✨" />
        <StatCard label="Открытий" value={stats?.discoveries_made ?? '-'} icon="🏆" />
        <StatCard label="Элементов" value={stats?.total_elements ?? '-'} icon="🧪" />
        <motion.div variants={fadeIn} className="col-span-2 glass-card p-3 text-sm flex items-center gap-2">
          <span className="text-slate-400 text-xs">В проекте</span>
          <span className="font-display text-neon-cyan">{stats?.joined_days ?? 0} дней</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <motion.div variants={fadeIn} className="glass-card p-3 text-center">
      <p className="text-lg mb-1">{icon}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-display text-lg">{value}</p>
    </motion.div>
  )
}

function BalanceCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <motion.div variants={fadeIn} className="text-center">
      <p className="text-lg mb-0.5">{icon}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="font-display text-sm mt-0.5">{value}</p>
    </motion.div>
  )
}
