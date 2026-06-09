import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  Award, BookOpen, Briefcase, Calendar, Clock, Flame, Fuel,
  Globe, Hammer, Package, Pencil, RefreshCw, Rocket, Shield, Sparkles,
  Star, Trophy, Zap,
} from 'lucide-react'

import { fadeIn, staggerContainer } from '../lib/animations'
import { useCountUp } from '../hooks/useCountUp'
import { getNextLevelXp, getXpProgress } from '../lib/xp'
import { getTierForLevel, findRank } from '../lib/ranks'
import { getAvatarUrl, getFirstName } from '../lib/telegram'
import { useGameStore } from '../store/game'
import type { UserStats } from '../types'

const tierGradients = [
  'from-cyan-500/20 to-blue-600/20',
  'from-green-500/20 to-emerald-600/20',
  'from-purple-500/20 to-violet-600/20',
  'from-amber-500/20 to-orange-600/20',
  'from-red-500/20 to-rose-600/20',
]
const tierRingColors = ['#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']

const ACHIEVEMENT_DEFS: Record<string, {
  icon: typeof Award; label: string; desc: string; reward: string
  check: (s: UserStats, streak: number) => boolean
  progress?: (s: UserStats, streak: number) => { current: number; max: number }
}> = {
  engineer: {
    icon: Hammer, label: 'Инженер', desc: 'Создайте первый артефакт', reward: '+50 XP',
    check: (s) => s.artifacts_crafted > 0,
  },
  explorer: {
    icon: Rocket, label: 'Исследователь', desc: 'Проведите 10 экспедиций', reward: '+100 XP · 10 ✦',
    check: (s) => s.completed_expeditions >= 10,
    progress: (s) => ({ current: s.completed_expeditions, max: 10 }),
  },
  veteran: {
    icon: Trophy, label: 'Ветеран', desc: 'Проведите 30 дней в проекте', reward: '+200 XP · 25 ✦',
    check: (s) => s.joined_days > 30,
    progress: (s) => ({ current: s.joined_days, max: 30 }),
  },
  collector: {
    icon: Sparkles, label: 'Коллекционер', desc: 'Соберите 5 разных артефактов', reward: '+100 XP · 10 ✦',
    check: (s) => s.unique_artifacts >= 5,
    progress: (s) => ({ current: s.unique_artifacts, max: 5 }),
  },
  hardworker: {
    icon: Briefcase, label: 'Трудоголик', desc: 'Завершите 25 экспедиций', reward: '+200 XP · 25 ✦',
    check: (s) => s.completed_expeditions >= 25,
    progress: (s) => ({ current: s.completed_expeditions, max: 25 }),
  },
  mechanic: {
    icon: Zap, label: 'Механик', desc: 'Экипируйте артефакты во все 8 слотов', reward: '+150 XP · 15 ✦',
    check: (s) => s.equipped_artifacts_count >= 8,
    progress: (s) => ({ current: s.equipped_artifacts_count, max: 8 }),
  },
  scholar: {
    icon: BookOpen, label: 'Эрудит', desc: 'Изучите 20 записей в Гайде', reward: '+150 XP · 15 ✦',
    check: (s) => s.guide_progress.entries_researched >= 20,
    progress: (s) => ({ current: s.guide_progress.entries_researched, max: 20 }),
  },
  lucky: {
    icon: Star, label: 'Счастливчик', desc: 'Исправьте 5 глитчей', reward: '+100 XP · 10 ✦',
    check: (s) => s.glitches_fixed >= 5,
    progress: (s) => ({ current: s.glitches_fixed, max: 5 }),
  },
  steadfast: {
    icon: Flame, label: 'Стойкий', desc: 'Достигните 7-дневного стрика', reward: '+100 XP · 10 ✦',
    check: (_, streak) => streak >= 7,
    progress: (_, streak) => ({ current: streak, max: 7 }),
  },
}

export function Profile() {
  const navigate = useNavigate()
  const user = useGameStore((s) => s.user)
  const stats = useGameStore((s) => s.stats)
  const ranksContent = useGameStore((s) => s.ranksContent)
  const ships = useGameStore((s) => s.ships)
  const achievements = useGameStore((s) => s.achievements)
  const loadProfile = useGameStore((s) => s.loadProfile)
  const loadStats = useGameStore((s) => s.loadStats)
  const loadAchievements = useGameStore((s) => s.loadAchievements)
  const claimAchievement = useGameStore((s) => s.claimAchievement)
  const updateNickname = useGameStore((s) => s.updateNickname)
  const artifactsContent = useGameStore((s) => s.artifactsContent)
  const [editing, setEditing] = useState(false)
  const [nick, setNick] = useState('')
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimResult, setClaimResult] = useState<{ aid: string; xp: number; xgen: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const avatarUrl = getAvatarUrl()
  const first = getFirstName()

  const level = user?.level ?? 1
  const xp = user?.xp ?? 0
  const nextLevelXp = getNextLevelXp(level)
  const xpPercent = getXpProgress(xp, level)
  const tier = getTierForLevel(level)
  const rank = findRank(level, ranksContent)

  const mainShip = ships[0] ?? null
  const shipConfig = useMemo(
    () => useGameStore.getState().shipsContent.find((c) => c.id === mainShip?.ship_config_id),
    [mainShip],
  )

  const equippedCount = mainShip?.equipped_artifacts?.length ?? 0

  const claimedSet = useMemo(() => new Set(achievements.filter((a) => a.claimed).map((a) => a.achievement_id)), [achievements])

  const levelXpCount = useCountUp(xp, 1200)
  const nextXpCount = useCountUp(nextLevelXp, 1200)
  const streakCount = useCountUp(user?.streak_days ?? 0, 1000)
  const starsCount = useCountUp(user?.balance_stars ?? 0, 1000)
  const xgenCount = useCountUp(user?.balance_xgen ?? 0, 1200)
  const expeditionsCount = useCountUp(stats?.total_expeditions ?? 0, 1000)
  const completedCount = useCountUp(stats?.completed_expeditions ?? 0, 1000)
  const artifactsCount = useCountUp(stats?.artifacts_crafted ?? 0, 1000)
  const joinedDaysCount = useCountUp(stats?.joined_days ?? 0, 1000)
  const xpEarnedCount = useCountUp(stats?.total_xp_earned ?? 0, 1200)
  const zonesCount = useCountUp(stats?.zones_explored ?? 0, 1000)

  useEffect(() => {
    loadProfile()
    loadStats()
    loadAchievements()
  }, [loadProfile, loadStats, loadAchievements])

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

  const handleClaim = useCallback(async (aid: string) => {
    setClaiming(aid)
    try {
      await claimAchievement(aid)
      const def = ACHIEVEMENT_DEFS[aid]
      const xpReward = def.reward.includes('XP') ? parseInt(def.reward.match(/\d+/)?.[0] || '0') : 0
      const xgenReward = def.reward.includes('✦') ? parseInt(def.reward.match(/(\d+)\s*✦/)?.[1] || '0') : 0
      setClaimResult({ aid, xp: xpReward, xgen: xgenReward })
      setTimeout(() => setClaimResult(null), 3000)
    } finally {
      setClaiming(null)
    }
  }, [claimAchievement])

  const nextRank = useMemo(() => {
    const next = ranksContent.find((r) => r.level > level)
    return next ? { title: next.title_key, at: next.level, remaining: next.level - level } : null
  }, [level, ranksContent])

  if (!user) return <div className="p-4 pb-28 space-y-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="shimmer rounded-xl h-24" />)}</div>

  const ringRadius = 36
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (xpPercent / 100) * ringCircumference

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-cyan">Профиль</h1>
      </motion.header>

      {/* Claim result toast */}
      <AnimatePresence>
        {claimResult && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-3 mb-4 flex items-center gap-3 border-neon-amber/20 bg-neon-amber/5"
          >
            <Award size={18} className="text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display text-amber-400 uppercase tracking-wider">Награда получена!</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                +{claimResult.xp} XP{claimResult.xgen > 0 ? ` · +${claimResult.xgen} ✦` : ''}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily reward notification */}
      {user.daily_reward && (
        <motion.div
          className="glass-card p-3 mb-4 flex items-center gap-3 border-neon-amber/20"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          <div className="w-10 h-10 rounded-full bg-neon-amber/20 flex items-center justify-center shrink-0">
            {user.streak_broken ? <RefreshCw size={18} className="text-amber-400" /> : <Flame size={18} className="text-amber-400" />}
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
        </motion.div>
      )}

      {/* Hero */}
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
              <Award size={10} />
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
                className="text-slate-600 hover:text-slate-300 transition-colors"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-600 mt-1">{rank?.description_key || ''}</p>

          {nextRank && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <Trophy size={10} className="text-amber-500/60" />
                Следующий ранг: <span className="text-amber-400/80 font-display">{nextRank.title}</span>
                <span className="text-slate-600">через {nextRank.remaining} ур.</span>
              </div>
            </div>
          )}
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

      {/* Guide + Ship Progress */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-neon-purple" />
            <span className="text-[10px] text-slate-500 font-display uppercase tracking-wider">Гайд</span>
          </div>
          <p className="font-display text-lg text-neon-purple tabular-nums">
            {stats?.guide_progress.completed_chapters ?? 0}
            <span className="text-slate-600 text-sm"> / {stats?.guide_progress.total_chapters ?? 0}</span>
          </p>
          <p className="text-[9px] text-slate-600 mt-1">{stats?.guide_progress.entries_researched ?? 0} записей изучено</p>
        </div>
        <div className="glass-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Rocket size={14} className="text-neon-cyan" />
            <span className="text-[10px] text-slate-500 font-display uppercase tracking-wider">Корабль</span>
          </div>
          <p className="font-display text-lg text-neon-cyan tabular-nums">
            {equippedCount}
            <span className="text-slate-600 text-sm"> / 8</span>
          </p>
          <p className="text-[9px] text-slate-600 mt-1">{shipConfig?.name_key || 'Vega MK-II'} · T{mainShip ? getTierForLevel(level) : '-'}</p>
        </div>
      </motion.div>

      {/* Balance cards */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <BalanceCard title="Стрик" value={streakCount} accent="#ef4444">
          <Flame size={18} className="text-red-400" />
        </BalanceCard>
        <BalanceCard title="Stars" value={starsCount} accent="#f59e0b">
          <Star size={18} className="text-amber-400" />
        </BalanceCard>
        <BalanceCard title="XGEN" value={xgenCount} accent="#22d3ee" pulse>
          <div className="text-[16px] font-display text-neon-cyan">✦</div>
        </BalanceCard>
      </motion.div>

      {/* Stats */}
      <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-3">Статистика</h2>

      {/* Expedition success */}
      {stats && stats.total_expeditions > 0 && (
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
                animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - stats.completed_expeditions / stats.total_expeditions) }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                transform="rotate(-90 28 28)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-display text-neon-green">
                {Math.round(stats.completed_expeditions / stats.total_expeditions * 100)}%
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 font-medium">Успешность экспедиций</p>
            <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-green" /> {stats.completed_expeditions} успешно</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {stats.failed_expeditions} провалено</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stat cards grid */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard icon={Rocket} label="Экспедиций" value={expeditionsCount} />
        <StatCard icon={Award} label="Завершено" value={completedCount} />
        <StatCard icon={Sparkles} label="Артефактов" value={artifactsCount} />
        <StatCard icon={Calendar} label="В проекте" value={joinedDaysCount} suffix="дн" />
        <StatCard icon={Globe} label="Зон открыто" value={zonesCount} />
        <StatCard icon={Zap} label="Всего XP" value={xpEarnedCount} />
      </motion.div>

      {/* Inventory summary */}
      <motion.button
        onClick={() => navigate('/inventory')}
        className="glass-card p-3 mb-4 w-full flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Package size={16} className="text-neon-cyan shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-4 text-[10px] text-slate-400">
          <span><Fuel size={12} className="inline mr-1 text-neon-cyan" />{stats?.resources.fuel ?? 0}</span>
          <span><Shield size={12} className="inline mr-1 text-neon-green" />{stats?.resources.repair_kits ?? 0}</span>
          <span><Sparkles size={12} className="inline mr-1 text-neon-purple" />{stats?.artifacts_crafted ?? 0}</span>
        </div>
        <span className="text-[10px] text-slate-600">Инвентарь →</span>
      </motion.button>

      {/* Artifact showcase */}
      {mainShip && mainShip.equipped_artifacts && mainShip.equipped_artifacts.length > 0 && (
        <motion.div className="mb-4" variants={fadeIn} initial="hidden" animate="visible">
          <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-2">Экипированные артефакты</h2>
          <div className="flex gap-1.5 flex-wrap">
            {mainShip.equipped_artifacts.map((artId, i) => {
              const art = artifactsContent.find((a) => a.id === artId)
              if (!art) return null
              const tColor = tierRingColors[Math.min(art.tier - 1, 4)]
              return (
                <div
                  key={`${artId}-${i}`}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[9px] font-display"
                  style={{
                    background: `${tColor}15`,
                    border: `1px solid ${tColor}30`,
                    color: tColor,
                  }}
                  title={art.name_key}
                >
                  {art.icon_path ? (
                    <img src={art.icon_path} alt={art.name_key} className="w-6 h-6 object-contain" />
                  ) : (
                    '⚙'
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Expedition timeline */}
      {stats && stats.recent_expeditions.length > 0 && (
        <motion.div className="mb-4" variants={fadeIn} initial="hidden" animate="visible">
          <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-2">Последние экспедиции</h2>
          <div className="flex flex-col gap-1.5">
            {stats.recent_expeditions.map((exp) => (
              <div key={exp.id} className="glass-card p-2.5 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${exp.status === 'completed' ? 'bg-neon-green' : exp.status === 'failed' ? 'bg-red-500' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-300 truncate">{exp.zone_config_id}</span>
                    <span className={`text-[8px] ${exp.status === 'completed' ? 'text-neon-green' : exp.status === 'failed' ? 'text-red-400' : 'text-slate-500'}`}>
                      {exp.status === 'completed' ? 'Успех' : exp.status === 'failed' ? 'Провал' : exp.status}
                    </span>
                  </div>
                  {exp.loot_summary && (
                    <p className="text-[8px] text-slate-600 truncate mt-0.5">{exp.loot_summary}</p>
                  )}
                </div>
                {exp.end_time && (
                  <span className="text-[8px] text-slate-600 shrink-0">
                    <Clock size={8} className="inline mr-0.5" />
                    {new Date(exp.end_time).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-3">
        Достижения
        <span className="text-slate-600 ml-1 font-mono">({claimedSet.size}/{Object.keys(ACHIEVEMENT_DEFS).length})</span>
      </h2>
      <motion.div
        className="grid grid-cols-2 gap-2"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {Object.entries(ACHIEVEMENT_DEFS).map(([aid, def]) => {
          const claimed = claimedSet.has(aid)
          const met = def.check(stats || {} as UserStats, user?.streak_days ?? 0)
          const Icon = def.icon
          const prog = def.progress?.(stats || {} as UserStats, user?.streak_days ?? 0)
          const canClaim = met && !claimed

          return (
            <motion.div
              key={aid}
              variants={fadeIn}
              className={`glass-card p-3 relative overflow-hidden ${
                claimed ? 'border-neon-green/20' : met ? 'border-amber-500/20' : 'opacity-50'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  claimed ? 'bg-neon-green/15 text-neon-green' : met ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-slate-600'
                }`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-display uppercase tracking-wider ${
                    claimed ? 'text-neon-green' : met ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {def.label}
                  </p>
                  <p className="text-[8px] text-slate-600 mt-0.5 leading-tight">{def.desc}</p>
                  {prog && !claimed && (
                    <div className="mt-1 h-1 bg-space-600 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: tierRingColors[tier - 1] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (prog.current / prog.max) * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                  {prog && !claimed && (
                    <p className="text-[7px] text-slate-600 mt-0.5">{prog.current}/{prog.max}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[7px] text-slate-600">{def.reward}</span>
                {canClaim && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClaim(aid)}
                    disabled={claiming === aid}
                    className="text-[8px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                  >
                    {claiming === aid ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>◌</motion.span>
                    ) : (
                      'Забрать'
                    )}
                  </motion.button>
                )}
                {claimed && (
                  <span className="text-[8px] text-neon-green/60">✓ Получено</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

function BalanceCard({ title, value, accent, pulse, children }: {
  title: string; value: number; accent: string; pulse?: boolean; children: React.ReactNode
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
      <div className="flex justify-center mb-1">{children}</div>
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

function StatCard({ icon: Icon, label, value, suffix }: {
  icon: typeof Rocket; label: string; value: number; suffix?: string
}) {
  return (
    <motion.div variants={fadeIn} className="glass-card p-3 text-center">
      <Icon size={14} className="mx-auto mb-1 text-slate-500" />
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <motion.p
        className="font-display text-lg tabular-nums"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {value}{suffix ? <span className="text-slate-600 text-xs ml-0.5">{suffix}</span> : ''}
      </motion.p>
    </motion.div>
  )
}
