import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'

import { fadeIn, staggerContainer } from '../lib/animations'
import { useCountUp } from '../hooks/useCountUp'
import { useGameStore } from '../store/game'
import type { Rank } from '../types'

const tierGradients = [
  'from-cyan-500/20 to-blue-600/20',
  'from-green-500/20 to-emerald-600/20',
  'from-purple-500/20 to-violet-600/20',
  'from-amber-500/20 to-orange-600/20',
  'from-red-500/20 to-rose-600/20',
]

const tierRingColors = ['#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']

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

function computeAchievements(stats: {
  artifacts_crafted: number; total_expeditions: number; joined_days: number
}) {
  return [
    { id: 'engineer', icon: '🔧', label: 'Инженер', earned: stats.artifacts_crafted > 0, desc: 'Создайте первый артефакт' },
    { id: 'explorer', icon: '🚀', label: 'Исследователь', earned: stats.total_expeditions >= 10, desc: 'Проведите 10 экспедиций' },
    { id: 'veteran', icon: '⭐', label: 'Ветеран', earned: stats.joined_days > 30, desc: 'Проведите 30 дней в проекте' },
  ]
}

export function Profile() {
  const { user, stats, ranksContent, loadProfile, loadStats, updateNickname } = useGameStore()
  const [editing, setEditing] = useState(false)
  const [nick, setNick] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const tg = (window as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { photo_url?: string; first_name?: string } } } } }).Telegram?.WebApp
  const avatarUrl = tg?.initDataUnsafe?.user?.photo_url
  const first = tg?.initDataUnsafe?.user?.first_name

  const level = user?.level ?? 1
  const xp = user?.xp ?? 0
  const nextLevelXp = level * 100
  const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100))
  const tier = getTierForLevel(level)
  const rank = findRank(level, ranksContent)

  const totalExps = stats?.total_expeditions || 0
  const completedExps = stats?.completed_expeditions || 0
  const successRate = totalExps > 0 ? Math.round((completedExps / totalExps) * 100) : 0
  const failRate = totalExps > 0 ? 100 - successRate : 0

  const achievements = useMemo(() => computeAchievements(stats || {
    artifacts_crafted: 0, total_expeditions: 0, joined_days: 0,
  }), [stats])

  const levelXpCount = useCountUp(xp, 1200)
  const nextXpCount = useCountUp(nextLevelXp, 1200)
  const streakCount = useCountUp(user?.streak_days ?? 0, 1000)
  const starsCount = useCountUp(user?.balance_stars ?? 0, 1000)
  const xgenCount = useCountUp(user?.balance_xgen ?? 0, 1200)
  const expeditionsCount = useCountUp(stats?.total_expeditions ?? 0, 1000)
  const completedCount = useCountUp(stats?.completed_expeditions ?? 0, 1000)
  const artifactsCount = useCountUp(stats?.artifacts_crafted ?? 0, 1000)

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [loadProfile, loadStats])

  const saveNick = useCallback(async () => {
    const trimmed = nick.trim()
    if (trimmed && trimmed !== user?.username) {
      await updateNickname(trimmed)
    }
    setEditing(false)
  }, [nick, user, updateNickname])

  const handleStartEdit = useCallback(() => {
    setNick(user?.username || first || 'Капитан')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [user, first])

  const [showReward, setShowReward] = useState(true)

  if (!user) return <div className="p-4 pb-28 space-y-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="shimmer rounded-xl h-24" />)}</div>

  const ringRadius = 36
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (xpPercent / 100) * ringCircumference

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-cyan">Профиль</h1>
      </motion.header>

      {/* Daily reward notification */}
      {showReward && user.daily_reward && (
        <motion.div
          className="glass-card p-3 mb-4 flex items-center gap-3 border-neon-amber/20"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="w-10 h-10 rounded-full bg-neon-amber/20 flex items-center justify-center text-lg shrink-0">
            {user.streak_broken ? '🔄' : '🔥'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display text-neon-amber uppercase tracking-wider">
              {user.streak_broken ? 'Стрик сброшен' : 'Ежедневная награда!'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Дней подряд: {user.streak_days}
              {user.daily_reward_items && ` · +${user.daily_reward_items.fragments ?? 0} Фрагментов бреда`}
            </p>
          </div>
          <button
            onClick={() => setShowReward(false)}
            className="text-slate-600 hover:text-slate-300 text-xs shrink-0"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Hero — avatar + level ring + rank */}
      <motion.div
        className="glass-card p-6 mb-4 text-center relative overflow-hidden"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className={`absolute inset-0 bg-gradient-to-b ${tierGradients[tier]} opacity-30`} />
        <div className="relative">
          <div className="inline-flex items-center justify-center mb-3">
            <svg width="96" height="96" className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '50%' }}>
              <circle cx="48" cy="48" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <motion.circle
                cx="48" cy="48" r={ringRadius} fill="none"
                stroke={tierRingColors[tier - 1] || '#22d3ee'}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple overflow-hidden ring-2 ring-white/10">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-display text-white">
                  {(first || '?')[0]}
                </div>
              )}
            </div>
          </div>

          {rank && (
            <motion.div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-display uppercase tracking-wider mb-2 border"
              style={{
                borderColor: `${tierRingColors[tier - 1]}33`,
                color: tierRingColors[tier - 1],
                backgroundColor: `${tierRingColors[tier - 1]}10`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
            >
              {rank.title_key}
            </motion.div>
          )}

          {editing ? (
            <div className="flex items-center justify-center gap-2 mt-1">
              <input
                ref={inputRef}
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                onBlur={saveNick}
                onKeyDown={(e) => { if (e.key === 'Enter') saveNick() }}
                className="bg-space-600 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-center text-slate-200 outline-none focus:border-neon-cyan/50 w-48"
                maxLength={32}
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-base text-slate-200 font-medium">{user.username || first || 'Капитан'}</span>
              <button
                onClick={handleStartEdit}
                className="text-slate-600 hover:text-slate-300 transition-colors text-[11px]"
              >
                ✏️
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-1">{rank?.description_key || ''}</p>
        </div>
      </motion.div>

      {/* XP & Progress */}
      <motion.div
        className="glass-card p-5 mb-4"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-display text-base border-2"
              style={{
                borderColor: tierRingColors[tier - 1],
                color: tierRingColors[tier - 1],
                boxShadow: `0 0 12px ${tierRingColors[tier - 1]}33`,
              }}
            >
              {level}
            </div>
            <div>
              <p className="font-display text-sm uppercase tracking-wider text-slate-300">Уровень {level}</p>
              <p className="text-[10px] text-slate-500">
                <span className="text-neon-cyan font-mono">{levelXpCount}</span> / {nextXpCount} XP
              </p>
            </div>
          </div>
        </div>

        <div className="relative h-2.5 bg-space-500 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: `linear-gradient(90deg, ${tierRingColors[tier - 1]}, ${tierRingColors[Math.min(tier, 4)] || '#a855f7'})`,
              boxShadow: `0 0 8px ${tierRingColors[tier - 1]}44`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {xpPercent > 80 && (
              <motion.div
                className="absolute inset-y-0 right-0 w-4 rounded-full bg-white/30"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        </div>

        <p className="text-[10px] text-slate-600 mt-2">
          До уровня {level + 1}: ещё <span className="text-slate-400 font-mono">{(nextLevelXp - xp > 0 ? nextLevelXp - xp : 0)}</span> XP
        </p>
      </motion.div>

      {/* Balance cards with count-up */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <BalanceCard title="Дней подряд" value={streakCount} icon="🔥" accent="#ef4444" />
        <BalanceCard title="Stars" value={starsCount} icon="⭐" accent="#f59e0b" />
        <BalanceCard title="XGEN" value={xgenCount} icon="🔷" accent="#22d3ee" pulse />
      </motion.div>

      {/* Stats */}
      <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-3">Статистика</h2>

      {/* Success rate donut */}
      {totalExps > 0 && (
        <motion.div
          className="glass-card p-4 mb-3 flex items-center gap-4"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="relative shrink-0">
            <svg width="56" height="56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <motion.circle
                cx="28" cy="28" r="24" fill="none"
                stroke="#22c55e" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 24}
                initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - successRate / 100) }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                transform="rotate(-90 28 28)"
              />
              <motion.circle
                cx="28" cy="28" r="24" fill="none"
                stroke="#ef4444" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 24}
                initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - (successRate + failRate) / 100) }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                transform="rotate(-90 28 28)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-display text-neon-green">{successRate}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 font-medium">Успешность экспедиций</p>
            <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-green" /> {completedExps} успешно</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {stats?.failed_expeditions || 0} провалено</span>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-2 gap-3 mb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard label="Экспедиций" value={expeditionsCount} icon="🚀" />
        <StatCard label="Завершено" value={completedCount} icon="✅" />
        <StatCard label="Артефактов" value={artifactsCount} icon="✨" />
        <motion.div variants={fadeIn} className="col-span-2 glass-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span className="text-xs text-slate-400">В проекте</span>
          </div>
          <span className="font-display text-sm text-neon-cyan">{stats?.joined_days ?? 0} дней</span>
        </motion.div>
      </motion.div>

      {/* Achievements */}
      <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-3">Достижения</h2>
      <motion.div
        className="flex gap-2 overflow-x-auto pb-2"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        {achievements.map((ach) => (
          <motion.div
            key={ach.id}
            className={`shrink-0 w-28 p-3 rounded-xl border text-center ${
              ach.earned
                ? 'bg-space-700/60 border-neon-green/20'
                : 'bg-space-700/20 border-white/5 opacity-40'
            }`}
            whileHover={ach.earned ? { y: -2, scale: 1.03 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className={`text-xl mb-1 ${ach.earned ? '' : 'grayscale'}`}>{ach.icon}</div>
            <p className={`text-[9px] font-display uppercase tracking-wider ${ach.earned ? 'text-neon-green' : 'text-slate-600'}`}>
              {ach.label}
            </p>
            <p className="text-[8px] text-slate-600 mt-0.5 leading-tight">{ach.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

function BalanceCard({ title, value, icon, accent, pulse }: {
  title: string; value: number; icon: string; accent: string; pulse?: boolean
}) {
  return (
    <motion.div
      variants={fadeIn}
      className="glass-card p-3 text-center relative overflow-hidden"
      style={{ borderColor: `${accent}22` }}
    >
      {pulse && (
        <motion.div
          className="absolute inset-0 opacity-[0.04]"
          style={{ background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)` }}
          animate={{ opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <p className="text-lg mb-0.5">{icon}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{title}</p>
      <motion.p
        className="font-display text-sm mt-0.5 tabular-nums"
        style={{ color: accent }}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {value}
      </motion.p>
    </motion.div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <motion.div variants={fadeIn} className="glass-card p-3 text-center">
      <p className="text-lg mb-1">{icon}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <motion.p
        className="font-display text-lg tabular-nums"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {value}
      </motion.p>
    </motion.div>
  )
}
