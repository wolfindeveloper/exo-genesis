import { memo, useMemo } from 'react'
import { motion } from 'motion/react'

import { cardHover } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Element, Zone } from '../types'

interface ZoneCardProps {
  zone: Zone
  onSelect: (zone: Zone) => void
  disabled?: boolean
  index?: number
  elementLookup?: Map<string, Element>
}

const tierColors = ['', 'text-neon-cyan', 'text-neon-green', 'text-neon-purple', 'text-neon-amber', 'text-neon-red']
const tierBorders = ['', 'border-neon-cyan/20', 'border-neon-green/20', 'border-neon-purple/20', 'border-neon-amber/20', 'border-neon-red/20']

export const ZoneCard = memo(function ZoneCard({ zone, onSelect, disabled, index = 0, elementLookup: externalLookup }: ZoneCardProps) {
  const elementsContent = useGameStore((s) => s.elementsContent)
  const localLookup = useMemo(() => new Map(elementsContent.map((e) => [e.id, e])), [elementsContent])
  const elementLookup = externalLookup || localLookup

  const lootOverflow = zone.loot_table.length > 4

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
      {...cardHover}
      onClick={() => onSelect(zone)}
      disabled={disabled}
      className={`glass-card p-4 ${tierBorders[zone.tier]} text-left w-full transition disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-display text-sm uppercase tracking-wider">{zone.name_key}</h3>
        <span className={`text-[10px] font-medium ${tierColors[zone.tier]}`}>T{zone.tier}</span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{zone.description_key}</p>
      <div className="flex gap-3 text-[11px] text-slate-500 mb-3">
        <span>⛽ {zone.fuel_cost}</span>
        <span>⏱ {zone.duration_hours}ч</span>
        <span>⚠ {Math.round(zone.risk_factor * 100)}%</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {zone.loot_table.slice(0, 4).map((loot) => {
          const el = elementLookup.get(loot.item_id)
          return (
            <span key={loot.item_id} className="text-[9px] bg-space-500/50 px-2 py-0.5 rounded-full text-slate-400 border border-white/5">
              {el?.name_key || 'Неизвестный предмет'}
            </span>
          )
        })}
        {lootOverflow && (
          <span className="text-[9px] bg-space-700/50 px-2 py-0.5 rounded-full text-slate-500 border border-white/5">
            +{zone.loot_table.length - 4}
          </span>
        )}
      </div>
    </motion.button>
  )
})
