import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { fadeIn, scaleIn, staggerContainer } from '../lib/animations'
import { api } from '../api/client'
import { useCountUp } from '../hooks/useCountUp'
import { useGameStore } from '../store/game'
import type { InventoryItem } from '../types'

const rarityColors: Record<string, string> = {
  common: 'border-slate-500/30 text-slate-300',
  uncommon: 'border-neon-green/30 text-neon-green',
  rare: 'border-neon-purple/30 text-neon-purple',
  epic: 'border-neon-amber/30 text-neon-amber',
  legendary: 'border-neon-red/30 text-neon-red',
}

const rarityBorders: Record<string, string> = {
  common: 'border-l-slate-500',
  uncommon: 'border-l-neon-green',
  rare: 'border-l-neon-purple',
  epic: 'border-l-neon-amber',
  legendary: 'border-l-neon-red',
}

const rarityGlows: Record<string, string> = {
  common: 'rgba(100,116,139,0.12)',
  uncommon: 'rgba(34,197,94,0.12)',
  rare: 'rgba(168,85,247,0.12)',
  epic: 'rgba(245,158,11,0.12)',
  legendary: 'rgba(239,68,68,0.12)',
}

const tierBadgeCls = [
  '', 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10',
  'text-neon-green border-neon-green/30 bg-neon-green/10',
  'text-neon-purple border-neon-purple/30 bg-neon-purple/10',
  'text-neon-amber border-neon-amber/30 bg-neon-amber/10',
  'text-neon-red border-neon-red/30 bg-neon-red/10',
]

const elementEmoji: Record<string, string> = {
  blue_electrical_tape: '🟦', compressed_luck: '🎲', warp_paper_clip: '📎',
  frozen_confusion: '💗', the_battery_will_die_tomorrow: '🔋',
  custom_rivet_set: '🔩', pride_of_cows_liquid_methane: '🐄',
  the_singular_button: '🔘', quick_no_lubricant: '🛢️', reflector_of_views: '✨',
  the_dust_of_paradoxes: '🌫️', logic_gate_inverter: '🔄', chrome_nostalgia: '💿',
  quantum_stabilizer: '⚛️', bergamot_crystal: '🍵',
  essential_oil_condensate: '💧', the_fractal_of_greatness: '🌀',
  fragments_of_a_deal: '📜', condensation_of_possibilities: '💫',
  the_core_of_reality: '🔮',
  "the_universe's_bug_report": '🐛', "the_demiurge's_ink": '🖋️',
  absolute_zero: '❄️', the_holy_spoon: '🥄', the_pen_of_laughter: '🪶',
}

const tierNames = ['', 'T1', 'T2', 'T3', 'T4', 'T5']

function recipeKey(ids: (string | undefined)[]): string {
  const valid = ids.filter(Boolean) as string[]
  return [...valid].sort().join(':')
}

const statConfig: Record<string, { label: string; icon: string; max: number; color: string }> = {
  speed_mod: { label: 'Скорость', icon: '⚡', max: 0.75, color: '#22d3ee' },
  stability_bonus: { label: 'Стабильность', icon: '🛡️', max: 25, color: '#22c55e' },
  fuel_efficiency: { label: 'Эффективность', icon: '⛽', max: 0.5, color: '#f59e0b' },
}

function tg() {
  return (window as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void } } } }).Telegram?.WebApp
}

export function Lab() {
  const { inventory, loadInventory, elementsContent, experiment, lastExperiment, isLoading } = useGameStore()

  const [slots, setSlots] = useState<(InventoryItem | null)[]>([null, null, null])
  const [nextSlot, setNextSlot] = useState(0)
  const [tierFilter, setTierFilter] = useState(0)
  const [failedKeys, setFailedKeys] = useState<string[]>([])
  const [showResult, setShowResult] = useState(true)
  const [weekInfo, setWeekInfo] = useState<{ week_seed: string; discoveries_this_week: number } | null>(null)
  const [statAnimate, setStatAnimate] = useState(false)
  const [resultKey, setResultKey] = useState(0)
  const workbenchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadInventory()
    api.getLabAttempts().then((r) => setFailedKeys(r.failed_keys)).catch(() => {})
    api.getWeekInfo().then((info) => setWeekInfo(info)).catch(() => {})
  }, [loadInventory])

  const elMap = useMemo(() => new Map(elementsContent.map((e) => [e.id, e])), [elementsContent])

  const elements = useMemo(() => {
    return inventory
      .filter((i) => i.item_type === 'element' && i.quantity > 0)
      .map((i) => ({ item: i, data: elMap.get(i.item_config_id) }))
      .filter((e) => e.data)
  }, [inventory, elMap])

  const tierList = useMemo(() => {
    const t = new Set(elements.map((e) => e.data!.tier))
    return [0, ...Array.from(t).sort((a, b) => a - b)]
  }, [elements])

  const currentKey = useMemo(() => recipeKey(slots.map((s) => s?.item_config_id)), [slots])
  const filledCount = slots.filter(Boolean).length
  const hasTried = filledCount >= 2 && failedKeys.includes(currentKey)
  const canCraft = filledCount >= 2 && !isLoading

  const handleSelectElement = useCallback((item: InventoryItem) => {
    if (nextSlot >= 3) return
    tg()?.HapticFeedback?.impactOccurred('light')
    const newSlots = [...slots]
    newSlots[nextSlot] = item
    setSlots(newSlots)
    setNextSlot(nextSlot + 1)
    setShowResult(false)
  }, [slots, nextSlot])

  const handleRemoveSlot = useCallback((index: number) => {
    tg()?.HapticFeedback?.impactOccurred('light')
    const newSlots = [...slots]
    newSlots[index] = null
    setSlots(newSlots)
    setNextSlot(newSlots.filter(Boolean).length)
  }, [slots])

  const handleCraft = useCallback(async () => {
    if (!canCraft) return
    tg()?.HapticFeedback?.impactOccurred('medium')
    setStatAnimate(false)
    const filled = slots.filter(Boolean) as InventoryItem[]
    await experiment(filled.map((s) => s.item_config_id))
    setSlots([null, null, null])
    setNextSlot(0)
    setShowResult(true)
    setResultKey((k) => k + 1)
    setTimeout(() => setStatAnimate(true), 100)
    loadInventory()
    api.getLabAttempts().then((r) => setFailedKeys(r.failed_keys)).catch(() => {})
    tg()?.HapticFeedback?.notificationOccurred('success')
  }, [canCraft, slots, experiment, loadInventory])

  const handleDismissResult = useCallback(() => {
    setShowResult(false)
    useGameStore.setState({ lastExperiment: null })
  }, [])

  const filtered = useMemo(() => {
    if (tierFilter === 0) return elements
    return elements.filter((e) => e.data!.tier === tierFilter)
  }, [elements, tierFilter])

  const grouped = useMemo(() => {
    const map = new Map<number, typeof filtered>()
    for (const e of filtered) {
      const t = e.data!.tier
      if (!map.has(t)) map.set(t, [])
      map.get(t)!.push(e)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [filtered])

  const selectedIds = useMemo(() => new Set(slots.filter(Boolean).map((s) => s!.item_config_id)), [slots])

  const barPct = (val: number, max: number) => Math.min(100, (val / max) * 100)

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-5" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-amber">Лаборатория</h1>
        <p className="text-xs text-slate-500 mt-0.5">Комбинируй элементы для крафта артефактов</p>
        {weekInfo && (
          <p className="text-[9px] text-slate-600 mt-1 font-mono">
            🗓️ Неделя {weekInfo.week_seed?.split('-W')[1] || '?'} · Открыто рецептов: {weekInfo.discoveries_this_week}
          </p>
        )}
      </motion.header>

      {/* Workbench */}
      <motion.div
        ref={workbenchRef}
        className="relative grid grid-cols-3 gap-3 mb-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {slots.map((slot, i) => {
          const ed = slot ? elMap.get(slot.item_config_id) : undefined
          const isFilled = !!slot
          const rcfg = ed ? rarityColors[ed.rarity] || rarityColors.common : ''
          return (
            <motion.div
              key={i}
              variants={scaleIn}
              onClick={() => slot && handleRemoveSlot(i)}
              className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors overflow-hidden ${
                isFilled
                  ? `${rcfg} border-solid bg-space-600/80`
                  : 'border-dashed border-white/10 hover:border-white/20 bg-space-700/30'
              }`}
              whileHover={isFilled ? { scale: 1.03 } : undefined}
              whileTap={isFilled ? { scale: 0.96 } : undefined}
              style={isFilled && ed ? { boxShadow: `0 0 16px ${rarityGlows[ed.rarity] || rarityGlows.common}` } : undefined}
            >
              {isFilled && ed ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-2xl mb-1">{elementEmoji[slot.item_config_id] || '?'}</div>
                  <div className="text-[9px] leading-tight text-slate-300 font-medium line-clamp-2">{ed.name_key}</div>
                  <span className={`mt-1 text-[7px] font-mono px-1 py-0.5 rounded border ${tierBadgeCls[ed.tier] || tierBadgeCls[1]}`}>
                    {tierNames[ed.tier] || 'T?'}
                  </span>
                  <motion.span
                    className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-black/40 flex items-center justify-center text-[8px] text-slate-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    ✕
                  </motion.span>
                </motion.div>
              ) : (
                <motion.span
                  className="text-[9px] text-slate-600 font-display"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {i === 0 ? 'Выберите' : `Элемент ${i + 1}`}
                </motion.span>
              )}
            </motion.div>
          )
        })}

        {/* Connection indicators */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {slots[0] && slots[1] && (
            <motion.div
              className="absolute w-6 h-[2px] rounded-full bg-gradient-to-r from-neon-cyan/40 to-neon-purple/40"
              style={{ left: 'calc(33.333% - 0.375rem)', top: '50%' }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
            />
          )}
          {slots[1] && slots[2] && (
            <motion.div
              className="absolute w-6 h-[2px] rounded-full bg-gradient-to-r from-neon-cyan/40 to-neon-purple/40"
              style={{ left: 'calc(66.666% - 0.375rem)', top: '50%' }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
            />
          )}
        </div>
      </motion.div>

      {/* Fail hint */}
      <AnimatePresence>
        {hasTried && (
          <motion.p
            className="text-[10px] text-neon-amber/70 mb-3 text-center font-mono"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            ⚠️ Ты уже пробовал эту комбинацию — она не сработала
          </motion.p>
        )}
      </AnimatePresence>

      {/* Craft button */}
      <motion.button
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        onClick={handleCraft}
        disabled={!canCraft}
        className="btn-glow w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-wider mb-5 transition-all disabled:opacity-25 disabled:scale-100 bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80 hover:from-neon-purple hover:to-neon-cyan active:scale-[0.97]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>◌</motion.span>
            Синтез...
          </span>
        ) : (
          `Синтез (${filledCount}/3)`
        )}
      </motion.button>

      {/* Result */}
      <AnimatePresence>
        {showResult && lastExperiment && (
          <motion.div
            key={lastExperiment.success ? `ok-${resultKey}` : `fail-${resultKey}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={`rounded-xl p-5 mb-5 border relative overflow-hidden ${
              lastExperiment.success ? 'bg-neon-green/5 border-neon-green/20' : 'bg-neon-red/5 border-neon-red/20'
            }`}
          >
            {/* Particles on success */}
            {showResult && lastExperiment.success && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => {
                  const gold = i % 2 === 0
                  const seed = (i * 7 + 13) % 100
                  const seed2 = (i * 11 + 5) % 100
                  const seed3 = (i * 3 + 19) % 100
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        background: gold ? '#22d3ee' : '#a855f7',
                        left: `${30 + seed}%`,
                        top: `${40 + seed2 * 0.2}%`,
                        boxShadow: gold ? '0 0 4px #22d3ee' : '0 0 4px #a855f7',
                      }}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{
                        scale: [0, 2, 0],
                        opacity: [1, 1, 0],
                        x: [0, (seed3 - 50) * 1.8],
                        y: [0, -(40 + seed2 * 0.8)],
                      }}
                      transition={{ duration: 0.8 + seed * 0.008, delay: i * 0.04, ease: 'easeOut' }}
                    />
                  )
                })}
              </div>
            )}

            {lastExperiment.success ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <motion.span
                    className="text-xl"
                    animate={{ rotate: [0, -10, 10, -5, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    ✨
                  </motion.span>
                  <h3 className="font-display text-sm uppercase tracking-wider text-neon-green">Артефакт создан!</h3>
                </div>
                <p className="text-sm text-slate-300 mb-1">{lastExperiment.artifact_name_key || 'Неизвестный артефакт'}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                  {lastExperiment.artifact_tier && (
                    <>
                      <span className={`font-mono px-1.5 py-0.5 rounded border ${tierBadgeCls[lastExperiment.artifact_tier] || tierBadgeCls[1]}`}>
                        T{lastExperiment.artifact_tier}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                    </>
                  )}
                  <span>{lastExperiment.artifact_rarity}</span>
                </div>

                {/* Stat bars */}
                {lastExperiment.stats_modifiers && Object.keys(lastExperiment.stats_modifiers).length > 0 && (
                  <div className="space-y-2 mb-3">
                    {Object.entries(lastExperiment.stats_modifiers).map(([key, val], idx) => {
                      const cfg = statConfig[key]
                      if (!cfg) return null
                      const pct = barPct(val as number, cfg.max)
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-slate-400">{cfg.icon} {cfg.label}</span>
                            <StatValue val={val as number} color={cfg.color} />
                          </div>
                          <div className="h-1.5 bg-space-600 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}44` }}
                              initial={{ width: 0 }}
                              animate={{ width: statAnimate ? `${pct}%` : 0 }}
                              transition={{ duration: 0.8, delay: 0.3 + idx * 0.15, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {lastExperiment.is_first_discoverer && (
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xs text-neon-amber font-display uppercase tracking-wider mb-2"
                  >
                    🏆 Первооткрыватель!
                  </motion.p>
                )}
                <p className="text-xs text-neon-green/70">+{lastExperiment.xp_gained} XP</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <motion.span
                    className="text-xl"
                    animate={{ rotate: [0, -5, 5, 0], y: [0, 4, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    💥
                  </motion.span>
                  <h3 className="font-display text-sm uppercase tracking-wider text-neon-red">Неудача</h3>
                </div>
                <p className="text-sm text-slate-400 mb-1">Комбинация не сработала</p>
                <p className="text-xs text-neon-green/70">+{lastExperiment.xp_gained} XP</p>
              </div>
            )}

            <motion.button
              onClick={handleDismissResult}
              className="mt-3 text-[10px] text-slate-500 hover:text-slate-300 font-display uppercase tracking-wider transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              ✕ Закрыть
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter chips */}
      <motion.div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" variants={fadeIn} initial="hidden" animate="visible">
        {tierList.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] font-display uppercase tracking-wider transition ${
              tierFilter === t
                ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/30'
                : 'bg-space-700/50 text-slate-500 border border-white/5 hover:border-white/20'
            }`}
          >
            {t === 0 ? 'Все' : `T${t}`}
          </button>
        ))}
      </motion.div>

      {/* Element sections */}
      {grouped.length === 0 ? (
        <p className="text-slate-500 text-xs mt-6 text-center">Нет подходящих элементов</p>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map(([tier, group]) => (
            <motion.div key={tier} variants={fadeIn} initial="hidden" animate="visible">
              <h3 className="text-[9px] font-display uppercase tracking-[0.15em] text-slate-600 mb-2 px-1">
                {tierNames[tier] || 'T?'}
              </h3>
              <motion.div className="flex flex-col gap-1.5" variants={staggerContainer} initial="hidden" animate="visible">
                {group.map(({ item, data }) => {
                  const ed = data!
                  const isSelected = selectedIds.has(item.item_config_id)
                  const isDisabled = isSelected || nextSlot >= 3
                  return (
                    <motion.button
                      key={item.id}
                      variants={scaleIn}
                      whileHover={!isDisabled ? { x: 4 } : undefined}
                      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                      onClick={() => !isDisabled && handleSelectElement(item)}
                      disabled={isDisabled}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs border-l-[3px] transition-all ${
                        rarityColors[ed.rarity] || rarityColors.common
                      } ${
                        isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer bg-space-700/40 hover:bg-space-600/60'
                      }`}
                      style={{
                        borderLeftColor: rarityBorders[ed.rarity]?.replace('border-l-', '') || '#64748b',
                        boxShadow: isSelected ? `0 0 12px ${rarityGlows[ed.rarity] || rarityGlows.common}` : undefined,
                      }}
                    >
                      <span className="text-lg shrink-0">{elementEmoji[item.item_config_id] || '📦'}</span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs text-slate-300 truncate">{ed.name_key}</p>
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${tierBadgeCls[tier] || tierBadgeCls[1]}`}>
                        {tierNames[tier] || 'T?'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono tabular-nums shrink-0">
                        ×{item.quantity}
                      </span>
                      {isSelected && (
                        <motion.span
                          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-neon-green flex items-center justify-center text-[8px] text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatValue({ val, color }: { val: number; color: string }) {
  const display = useCountUp(val, 600, false)
  const formatted = val >= 1 ? display.toFixed(1) : display.toFixed(2)
  const prefix = val >= 0 ? '+' : ''
  return <span className="font-mono text-xs" style={{ color }}>{prefix}{formatted}</span>
}
