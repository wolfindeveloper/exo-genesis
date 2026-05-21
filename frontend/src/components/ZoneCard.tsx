import { motion } from 'motion/react'

import { cardHover } from '../lib/animations'
import type { Zone } from '../types'

interface ZoneCardProps {
  zone: Zone
  onSelect: (zone: Zone) => void
  disabled?: boolean
  index?: number
}

const tierBorders = ['', 'tier-border-1', 'tier-border-2', 'tier-border-3', 'tier-border-4', 'tier-border-5']
const tierColors = ['', 'text-neon-cyan', 'text-neon-green', 'text-neon-purple', 'text-neon-amber', 'text-neon-red']

export function ZoneCard({ zone, onSelect, disabled, index = 0 }: ZoneCardProps) {
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
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-display text-sm uppercase tracking-wider">{zone.name_key.replace(/_/g, ' ')}</h3>
        <span className={`text-[10px] font-medium ${tierColors[zone.tier]}`}>TIER {zone.tier}</span>
      </div>
      <div className="flex gap-3 text-[11px] text-slate-500 mb-3">
        <span>⛽ {zone.fuel_cost}</span>
        <span>⏱ {zone.duration_hours}ч</span>
        <span>⚠ {Math.round(zone.risk_factor * 100)}%</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {zone.loot_table.slice(0, 4).map((loot) => (
          <span key={loot.item_id} className="text-[9px] bg-space-500/50 px-2 py-0.5 rounded-full text-slate-400 border border-white/5">
            {loot.item_id.replace('elem_', '').replace('_', ' ')}
          </span>
        ))}
      </div>
    </motion.button>
  )
}
