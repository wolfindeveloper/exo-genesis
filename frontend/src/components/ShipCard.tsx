import { memo, useState } from 'react'
import { motion } from 'motion/react'

import { cardHover } from '../lib/animations'
import { useExpeditionTimer } from '../hooks/useTimer'
import { useGameStore } from '../store/game'
import type { Ship, ShipConfig } from '../types'

const statusConfig: Record<string, { label: string; cls: string }> = {
  idle: { label: 'Готов', cls: 'bg-neon-green/10 text-neon-green border border-neon-green/20' },
  expedition: { label: 'В полёте', cls: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' },
  repair: { label: 'Ремонт', cls: 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20' },
}

const tierColors = ['', '#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']
const tierGradients = [
  '',
  'linear-gradient(135deg, #0891b2 0%, #0284c7 50%, #0e7490 100%)',
  'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
  'linear-gradient(135deg, #9333ea 0%, #7e22ce 50%, #6b21a8 100%)',
  'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)',
  'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
]

function stabilityColor(pct: number): string {
  if (pct > 60) return '#22c55e'
  if (pct > 30) return '#eab308'
  return '#ef4444'
}

interface ShipCardProps {
  ship: Ship
  config: ShipConfig | null
  index?: number
  onTap: (ship: Ship) => void
}

export const ShipCard = memo(function ShipCard({ ship, config, index = 0, onTap }: ShipCardProps) {
  const [imgError, setImgError] = useState(false)

  const tier = config?.tier || parseInt(ship.ship_config_id.match(/t(\d)/)?.[1] || '1')
  const name = config?.name_key || ship.ship_config_id.replace(/_/g, ' ')
  const st = statusConfig[ship.status] || statusConfig.idle
  const fuelMax = config?.stats?.fuel_capacity || 50
  const fuelPct = Math.min((ship.fuel_current / fuelMax) * 100, 100)

  // Live timer for expedition ships
  const activeExpeditions = useGameStore((s) => s.activeExpeditions)
  const myExp = ship.status === 'expedition'
    ? activeExpeditions.find((e) => e.ship_id === ship.id)
    : null
  const timer = myExp
    ? useExpeditionTimer(myExp.start_time, myExp.end_time)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
      {...cardHover}
      className="glass-card overflow-hidden cursor-pointer"
      style={{ borderColor: `${tierColors[tier]}33`, boxShadow: `0 0 12px ${tierColors[tier]}15, inset 0 0 12px ${tierColors[tier]}08` }}
      onClick={() => onTap(ship)}
    >
      <div className="relative h-32 bg-space-900/60 overflow-hidden">
        {config?.art_path && !imgError ? (
          <img
            src={config.art_path}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: tierGradients[tier] }}
          >
            <span className="text-5xl opacity-30">🚀</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/20 to-transparent" />
        <span className={`absolute top-2 right-2 text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${st.cls}`}>
          {timer ? timer.display : st.label}
        </span>
        <div className="absolute bottom-2 left-3 flex gap-1">
          {Array.from({ length: tier }, (_, i) => (
            <span key={i} className="text-xs drop-shadow-lg" style={{ color: tierColors[tier] }}>★</span>
          ))}
        </div>
      </div>

      <div className="p-3 pt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-sm uppercase tracking-wider text-slate-300 truncate">{name}</h3>
          {ship.equipped_artifacts.length > 0 && (
            <span className="text-[9px] text-neon-purple/70 ml-2 shrink-0">
              ✦ {ship.equipped_artifacts.length}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 uppercase tracking-wider">Прочность</span>
              <span className="font-mono text-slate-400">{ship.stability}%</span>
            </div>
            <div className="relative h-5 bg-space-500 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full flex items-center justify-end pr-1.5"
                initial={{ width: 0 }}
                animate={{ width: `${ship.stability}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                style={{ backgroundColor: stabilityColor(ship.stability) }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 uppercase tracking-wider">Топливо</span>
              <span className="font-mono text-slate-400">{ship.fuel_current}/{fuelMax}</span>
            </div>
            <div className="relative h-5 bg-space-500 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full flex items-center justify-end pr-1.5"
                initial={{ width: 0 }}
                animate={{ width: `${fuelPct}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                style={{ backgroundColor: '#f59e0b' }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
