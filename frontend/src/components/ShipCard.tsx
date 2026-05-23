import { useState } from 'react'
import { motion } from 'motion/react'

import { cardHover } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Ship } from '../types'

const statusConfig: Record<string, { label: string; cls: string }> = {
  idle: { label: 'Готов', cls: 'bg-neon-green/10 text-neon-green border border-neon-green/20' },
  expedition: { label: 'В полёте', cls: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' },
  repair: { label: 'Ремонт', cls: 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20' },
}

const tierColors = ['', '#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']

export function ShipCard({ ship, index = 0 }: { ship: Ship; index?: number }) {
  const { shipsContent } = useGameStore()
  const config = shipsContent.find((s) => s.id === ship.ship_config_id)
  const [imgError, setImgError] = useState(false)

  const tier = config?.tier || parseInt(ship.ship_config_id.match(/t(\d)/)?.[1] || '1')
  const name = config?.name_key || ship.ship_config_id.replace(/_/g, ' ')
  const desc = config?.description_key || ''
  const st = statusConfig[ship.status] || statusConfig.idle

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
      {...cardHover}
      className="glass-card overflow-hidden"
      style={{ borderColor: `${tierColors[tier]}33`, boxShadow: `0 0 12px ${tierColors[tier]}15, inset 0 0 12px ${tierColors[tier]}08` }}
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
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">🚀</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/20 to-transparent" />
        <span className={`absolute top-2 right-2 text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${st.cls}`}>
          {st.label}
        </span>
      </div>

      <div className="p-4 pt-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-display text-sm uppercase tracking-wider text-slate-300">{name}</h3>
            {desc && <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>}
            <div className="flex gap-1 mt-1.5">
              {Array.from({ length: tier }, (_, i) => (
                <span key={i} className="text-xs" style={{ color: tierColors[tier] }}>★</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Прочность</span>
            <div className="h-1.5 bg-space-500 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, #22c55e, ${tierColors[tier]})` }}
                initial={{ width: 0 }}
                animate={{ width: `${ship.stability}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Топливо</span>
            <p className="font-display text-sm mt-0.5">{ship.fuel_current}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
