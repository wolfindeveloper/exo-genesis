import { motion } from 'motion/react'

import type { Ship, ShipConfig } from '../types'

const tierColors = ['', '#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']
const tierGradients = [
  '',
  'from-cyan-600/30 via-space-800 to-space-950',
  'from-green-600/30 via-space-800 to-space-950',
  'from-purple-600/30 via-space-800 to-space-950',
  'from-amber-600/30 via-space-800 to-space-950',
  'from-red-600/30 via-space-800 to-space-950',
]
const statusConfig: Record<string, { label: string; cls: string }> = {
  idle: { label: 'Готов', cls: 'bg-neon-green/10 text-neon-green border border-neon-green/20' },
  expedition: { label: 'В полёте', cls: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' },
  repair: { label: 'Ремонт', cls: 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20' },
}

function stabilityColor(pct: number): string {
  if (pct > 60) return '#22c55e'
  if (pct > 30) return '#eab308'
  return '#ef4444'
}

interface ShipDetailModalProps {
  ship: Ship
  config: ShipConfig | null
  onClose: () => void
  onSend: () => void
}

export function ShipDetailModal({ ship, config, onClose, onSend }: ShipDetailModalProps) {
  const tier = config?.tier || 1
  const name = config?.name_key || ship.ship_config_id.replace(/_/g, ' ')
  const st = statusConfig[ship.status] || statusConfig.idle
  const fuelMax = config?.stats?.fuel_capacity || 50
  const fuelPct = Math.min((ship.fuel_current / fuelMax) * 100, 100)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-space-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '30%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Art header */}
        <div className={`relative h-48 bg-gradient-to-br ${tierGradients[tier]} flex items-center justify-center overflow-hidden`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />
          <div className="text-center">
            <motion.div
              className="text-6xl mb-2"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              🚀
            </motion.div>
            <h2 className="font-display text-lg uppercase tracking-[0.15em]" style={{ color: tierColors[tier] }}>{name}</h2>
            <span className={`text-[10px] text-white/40 font-display uppercase tracking-wider mt-1 block`}>
              Tier {tier} · {st.label}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          {config?.description_key && (
            <p className="text-xs text-slate-400 leading-relaxed">{config.description_key}</p>
          )}

          {/* Stats */}
          <div>
            <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-3">Характеристики</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Прочность</span>
                  <span className="font-mono text-slate-300">{ship.stability}%</span>
                </div>
                <div className="relative h-5 bg-space-500 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${ship.stability}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ backgroundColor: stabilityColor(ship.stability) }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Топливо</span>
                  <span className="font-mono text-slate-300">{ship.fuel_current}/{fuelMax}</span>
                </div>
                <div className="relative h-5 bg-space-500 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${fuelPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ backgroundColor: '#f59e0b' }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Скорость</span>
                <span className="font-mono text-slate-300">×{config?.stats?.speed_mod.toFixed(1) || '1.0'}</span>
              </div>
            </div>
          </div>

          {/* Equipped artifacts */}
          <div>
            <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Артефакты</h4>
            {ship.equipped_artifacts.length === 0 ? (
              <p className="text-xs text-slate-600">Не установлены</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {ship.equipped_artifacts.map((artId) => (
                  <span key={artId} className="text-[10px] bg-space-700/50 px-2.5 py-1 rounded-full text-neon-purple/80 border border-neon-purple/10">
                    ✦ {artId.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action button */}
          {ship.status === 'idle' && (
            <button
              onClick={onSend}
              className="btn-glow w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-wider transition bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80 hover:from-neon-purple hover:to-neon-cyan"
            >
              🚀 Отправить в полёт
            </button>
          )}
          {ship.status === 'repair' && (
            <div className="w-full py-3 rounded-xl text-center text-xs text-neon-amber/70 bg-neon-amber/5 border border-neon-amber/10 font-display uppercase tracking-wider">
              🔧 Корабль на ремонте
            </div>
          )}
          {ship.status === 'expedition' && (
            <div className="w-full py-3 rounded-xl text-center text-xs text-neon-cyan/70 bg-neon-cyan/5 border border-neon-cyan/10 font-display uppercase tracking-wider">
              🌌 В полёте
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
