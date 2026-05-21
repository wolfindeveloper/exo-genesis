import type { Zone } from '../types'

interface ZoneCardProps {
  zone: Zone
  onSelect: (zone: Zone) => void
  disabled?: boolean
}

const tierBorders = ['', 'border-cyan-400/40', 'border-purple-400/40', 'border-red-400/40']

export function ZoneCard({ zone, onSelect, disabled }: ZoneCardProps) {
  return (
    <button
      onClick={() => onSelect(zone)}
      disabled={disabled}
      className={`bg-slate-800/60 rounded-xl p-4 border ${tierBorders[zone.tier]} text-left w-full backdrop-blur-sm transition hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold">{zone.name_key.replace(/_/g, ' ')}</h3>
        <span className="text-xs text-slate-400">Tier {zone.tier}</span>
      </div>
      <div className="flex gap-4 text-xs text-slate-400 mb-3">
        <span>⛽ {zone.fuel_cost}</span>
        <span>⏱ {zone.duration_hours}ч</span>
        <span>⚠ {Math.round(zone.risk_factor * 100)}%</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {zone.loot_table.slice(0, 3).map((loot) => (
          <span key={loot.item_id} className="text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded">
            {loot.item_id.replace('elem_', '').replace('_', ' ')}
          </span>
        ))}
      </div>
    </button>
  )
}
