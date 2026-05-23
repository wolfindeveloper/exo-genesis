import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import { fadeIn, scaleIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { InventoryItem } from '../types'

const rarityColors: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-slate-500/20', bg: 'bg-slate-500/5', text: 'text-slate-300' },
  uncommon: { border: 'border-neon-green/20', bg: 'bg-neon-green/5', text: 'text-neon-green' },
  rare: { border: 'border-neon-purple/20', bg: 'bg-neon-purple/5', text: 'text-neon-purple' },
  epic: { border: 'border-neon-amber/20', bg: 'bg-neon-amber/5', text: 'text-neon-amber' },
  legendary: { border: 'border-neon-red/20', bg: 'bg-neon-red/5', text: 'text-neon-red' },
}

const typeIcons: Record<string, string> = { element: '🧪', resource: '📦', artifact: '✨', consumable: '💊' }
const typeLabels: Record<string, string> = {
  all: 'Всё', element: 'Элементы', resource: 'Ресурсы', artifact: 'Артефакты', consumable: 'Расходники',
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

export function Inventory() {
  const { inventory, loadInventory, elementsContent, resourcesContent } = useGameStore()
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { loadInventory() }, [])

  const nameLookup = new Map([
    ...elementsContent.map((e) => [e.id, { name_key: e.name_key, rarity: e.rarity, icon_path: e.icon_path }] as const),
    ...resourcesContent.map((r) => [r.id, { name_key: r.name_key, rarity: '', icon_path: r.icon_path }] as const),
  ])
  const filtered = filter === 'all' ? inventory : inventory.filter((i) => i.item_type === filter)
  const types = ['all', ...new Set(inventory.map((i) => i.item_type))]

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-4" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-green">Инвентарь</h1>
        <p className="text-xs text-slate-500 mt-1">{inventory.length} предметов</p>
      </motion.header>

      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-display uppercase tracking-wider transition whitespace-nowrap ${
              filter === t
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                : 'bg-space-700/50 text-slate-500 border border-white/5 hover:border-white/20'
            }`}
          >
            {typeIcons[t] || ''} {typeLabels[t] || t}
          </button>
        ))}
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="glass-card p-8 text-center">
          <p className="text-slate-500 text-xs font-display uppercase tracking-wider">Пусто</p>
        </motion.div>
      ) : (
        <motion.div className="flex flex-col gap-2" variants={staggerContainer} initial="hidden" animate="visible">
          {filtered.map((item) => (
            <InventoryRow key={item.id} item={item} nameLookup={nameLookup} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

function InventoryRow({ item, nameLookup }: { item: InventoryItem; nameLookup: Map<string, { name_key: string; rarity: string; icon_path: string }> }) {
  const [imgError, setImgError] = useState(false)
  const entry = nameLookup.get(item.item_config_id)
  const rarity = entry?.rarity || (item.metadata?.rarity as string) || 'common'
  const rc = rarityColors[rarity] || rarityColors.common
  const meta = item.metadata || {}
  const hasIcon = entry?.icon_path && !imgError

  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ x: 4, transition: { type: 'spring', stiffness: 300 } }}
      className={`glass-card p-3 flex items-center gap-3 ${rc.border} ${rc.bg}`}
      style={{ borderLeft: '3px solid', borderLeftColor: rarity === 'common' ? '#64748b' : rarity === 'uncommon' ? '#22c55e' : rarity === 'rare' ? '#a855f7' : rarity === 'epic' ? '#f59e0b' : '#ef4444' }}
    >
      {hasIcon ? (
        <img
          src={entry.icon_path}
          alt={entry?.name_key || item.item_config_id}
          className="w-8 h-8 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="text-xl">{elementEmoji[item.item_config_id] || typeIcons[item.item_type] || '📦'}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry?.name_key || item.item_config_id.replace(/_/g, ' ')}</p>
        <p className="text-[10px] text-slate-500">{typeLabels[item.item_type] || item.item_type}</p>
        {item.item_type === 'artifact' && Object.keys(meta).length > 0 && (
          <div className="flex gap-2 mt-1">
            {(meta.speed_mod as number) && <span className="text-[9px] text-neon-cyan/70">⚡ +{(meta.speed_mod as number).toFixed(2)}</span>}
            {(meta.stability_bonus as number) && <span className="text-[9px] text-neon-green/70">🛡️ +{meta.stability_bonus as number}</span>}
            {(meta.fuel_efficiency as number) && <span className="text-[9px] text-neon-amber/70">⛽ +{(meta.fuel_efficiency as number).toFixed(2)}</span>}
          </div>
        )}
      </div>
      <motion.div className="text-right" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
        <span className={`text-lg font-display ${rc.text}`}>{item.quantity}</span>
      </motion.div>
    </motion.div>
  )
}
