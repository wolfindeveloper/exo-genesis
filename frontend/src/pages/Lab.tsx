import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { fadeIn, scaleIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { InventoryItem } from '../types'

const rarityColors: Record<string, string> = {
  common: 'border-slate-500/30 text-slate-300',
  uncommon: 'border-neon-green/30 text-neon-green',
  rare: 'border-neon-purple/30 text-neon-purple',
  epic: 'border-neon-amber/30 text-neon-amber',
  legendary: 'border-neon-red/30 text-neon-red',
}

const rarityLabels: Record<string, string> = {
  common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий',
  epic: 'Эпический', legendary: 'Легендарный',
}

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

export function Lab() {
  const { inventory, loadInventory, experiment, lastExperiment, isLoading, elementsContent } = useGameStore()
  const [slots, setSlots] = useState<(InventoryItem | null)[]>([null, null, null])
  const [nextSlot, setNextSlot] = useState(0)
  const [showSparkles, setShowSparkles] = useState(false)

  useEffect(() => { loadInventory() }, [])

  const elements = inventory.filter((i) => i.item_type === 'element' && i.quantity > 0)
  const elementLookup = new Map(elementsContent.map((e) => [e.id, e]))

  const handleSelectElement = (item: InventoryItem) => {
    if (nextSlot >= 3) return
    const newSlots = [...slots]
    newSlots[nextSlot] = item
    setSlots(newSlots)
    setNextSlot(nextSlot + 1)
  }

  const handleRemoveSlot = (index: number) => {
    const newSlots = [...slots]
    newSlots[index] = null
    setSlots(newSlots)
    setNextSlot(newSlots.filter(Boolean).length)
  }

  const handleCraft = async () => {
    const filled = slots.filter(Boolean)
    if (filled.length < 2) return
    setShowSparkles(true)
    await experiment(filled.map((s) => s!.item_config_id))
    setSlots([null, null, null])
    setNextSlot(0)
    setTimeout(() => setShowSparkles(false), 1500)
  }

  const filledCount = slots.filter(Boolean).length

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-amber">Лаборатория</h1>
        <p className="text-xs text-slate-500 mt-1">Комбинируй элементы для крафта артефактов</p>
      </motion.header>

      {/* Слоты крафта */}
      <motion.div className="grid grid-cols-3 gap-3 mb-6" variants={staggerContainer} initial="hidden" animate="visible">
        {slots.map((slot, i) => {
          const ed = slot ? elementLookup.get(slot.item_config_id) : undefined
          return (
            <motion.div
              key={i}
              variants={scaleIn}
              onClick={() => slot && handleRemoveSlot(i)}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center text-center p-2 cursor-pointer transition-colors relative overflow-hidden ${
                slot
                  ? `${rarityColors[ed?.rarity || 'common']} border-solid bg-space-600/80`
                  : 'border-dashed border-white/10 hover:border-white/20 bg-space-700/30'
              }`}
            >
              {slot ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="text-2xl mb-1">{elementEmoji[slot.item_config_id] || '?'}</div>
                  <div className="text-[10px] leading-tight text-slate-300">{ed?.name_key || slot.item_config_id}</div>
                </motion.div>
              ) : (
                <span className="text-white/20 font-display text-sm">{i + 1}</span>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Кнопка крафта */}
      <motion.button
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        onClick={handleCraft}
        disabled={filledCount < 2 || isLoading}
        className="btn-glow w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-wider mb-6 transition disabled:opacity-30 bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80 hover:from-neon-purple hover:to-neon-cyan"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>◌</motion.span>
            Крафт...
          </span>
        ) : (
          `Синтез (${filledCount}/3)`
        )}
      </motion.button>

      {/* Искры */}
      <AnimatePresence>
        {showSparkles && (
          <div className="relative h-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-0 w-1.5 h-1.5 rounded-full"
                style={{ background: i % 2 === 0 ? '#22d3ee' : '#a855f7', boxShadow: i % 2 === 0 ? '0 0 6px #22d3ee' : '0 0 6px #a855f7' }}
                variants={{
                  initial: { opacity: 0, scale: 0, x: 0, y: 0 },
                  animate: {
                    opacity: [0, 1, 0], scale: [0, 1.5, 0],
                    x: [0, (Math.random() - 0.5) * 120], y: [0, -40 - Math.random() * 80],
                    transition: { duration: 0.8 + Math.random() * 0.4, delay: i * 0.06, ease: 'easeOut' },
                  },
                }}
                initial="initial"
                animate="animate"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Результат */}
      <AnimatePresence mode="wait">
        {lastExperiment && (
          <motion.div
            key={lastExperiment.success ? 'success' : 'fail'}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={`rounded-xl p-5 mb-6 border ${lastExperiment.success ? 'bg-neon-green/5 border-neon-green/20' : 'bg-neon-red/5 border-neon-red/20'}`}
          >
            {lastExperiment.success ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <motion.span className="text-xl" animate={{ rotate: [0, -10, 10, -5, 0] }} transition={{ duration: 0.5 }}>✨</motion.span>
                  <h3 className="font-display text-sm uppercase tracking-wider text-neon-green">Артефакт создан!</h3>
                </div>
                <p className="text-sm text-slate-300 mb-1">{lastExperiment.artifact_name_key?.replace(/_/g, ' ') || 'Неизвестный артефакт'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="font-display text-[10px]">TIER {lastExperiment.artifact_tier}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{rarityLabels[lastExperiment.artifact_rarity || ''] || lastExperiment.artifact_rarity}</span>
                </div>
                {lastExperiment.is_first_discoverer && (
                  <motion.p initial={{ scale: 0 }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
                    className="text-xs text-neon-amber font-display uppercase tracking-wider">🏆 Первооткрыватель!</motion.p>
                )}
                <p className="text-xs text-neon-green/70 mt-2">+{lastExperiment.xp_gained} XP</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <motion.span className="text-xl" animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.3 }}>💥</motion.span>
                  <h3 className="font-display text-sm uppercase tracking-wider text-neon-red">Неудача</h3>
                </div>
                <p className="text-sm text-slate-400">Комбинация не сработала</p>
                <p className="text-xs text-neon-green/70 mt-2">+{lastExperiment.xp_gained} XP</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Доступные элементы */}
      <h2 className="text-[10px] font-display uppercase tracking-[0.15em] text-slate-500 mb-3">Доступные элементы</h2>
      {elements.length === 0 ? (
        <p className="text-slate-500 text-xs">Нет элементов. Исследуй зоны в Галактике!</p>
      ) : (
        <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="visible">
          {elements.map((item) => {
            const ed = elementLookup.get(item.item_config_id)
            const isSelected = slots.some((s) => s?.item_config_id === item.item_config_id)
            return (
              <motion.button
                key={item.id}
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectElement(item)}
                disabled={isSelected || nextSlot >= 3}
                className={`px-3 py-2 rounded-xl text-xs border transition ${
                  rarityColors[ed?.rarity || 'common']
                } ${isSelected ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} bg-space-700/50 hover:bg-space-600/80`}
              >
                <span className="mr-1">{elementEmoji[item.item_config_id] || '?'}</span>
                {ed?.name_key || item.item_config_id}
                <span className="ml-1 text-slate-600">x{item.quantity}</span>
              </motion.button>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
