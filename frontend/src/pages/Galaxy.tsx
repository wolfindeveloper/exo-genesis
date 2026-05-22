import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { ZoneCard } from '../components/ZoneCard'
import { fadeIn, scaleIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Zone } from '../types'

const tierLabels = ['', 'T1', 'T2', 'T3', 'T4', 'T5']
const tierColors = ['', 'text-neon-cyan border-neon-cyan/30', 'text-neon-green border-neon-green/30', 'text-neon-purple border-neon-purple/30', 'text-neon-amber border-neon-amber/30', 'text-neon-red border-neon-red/30']
const tierBg = ['', 'bg-neon-cyan/10', 'bg-neon-green/10', 'bg-neon-purple/10', 'bg-neon-amber/10', 'bg-neon-red/10']

export function Galaxy() {
  const { ships: userShips, zonesContent: zones, shipsContent, startExpedition, isLoading } = useGameStore()
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)
  const [showShipPicker, setShowShipPicker] = useState(false)
  const [tierFilter, setTierFilter] = useState(1)

  const shipConfigLookup = useMemo(() => new Map(shipsContent.map((s) => [s.id, s])), [shipsContent])
  const idleShips = userShips.filter((s) => s.status === 'idle')
  const selectedShip = idleShips.find((s) => s.id === selectedShipId)
  const maxTier = Math.max(...zones.map((z) => z.tier), 1)

  const filteredZones = zones.filter((z) => z.tier === tierFilter)

  const handleSelectZone = async (zone: Zone) => {
    if (!selectedShipId) return
    await startExpedition(selectedShipId, zone.id)
  }

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-5" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-purple">Галактика</h1>
        <p className="text-xs text-slate-500 mt-1">Выбери зону для исследования</p>
      </motion.header>

      {/* Ship selector */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-5">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Корабль</label>
        {idleShips.length === 0 ? (
          <div className="glass-card p-3 text-center">
            <p className="text-[11px] text-neon-amber/70">Нет свободных кораблей</p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowShipPicker(!showShipPicker)}
              className="w-full glass-card p-3 text-left flex items-center justify-between"
            >
              {selectedShip ? (
                <div>
                  <p className="text-sm font-medium">{shipConfigLookup.get(selectedShip.ship_config_id)?.name_key || selectedShip.ship_config_id}</p>
                  <p className="text-[10px] text-slate-500">⛽ {selectedShip.fuel_current} · ⚡ {selectedShip.stability}%</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Нажми, чтобы выбрать...</p>
              )}
              <span className={`transition-transform ${showShipPicker ? 'rotate-180' : ''}`}>▾</span>
            </button>
            <AnimatePresence>
              {showShipPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card mt-1 p-1 flex flex-col">
                    {idleShips.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedShipId(s.id); setShowShipPicker(false) }}
                        className={`text-left p-2.5 rounded-lg text-sm transition ${
                          selectedShipId === s.id ? 'bg-neon-purple/20' : 'hover:bg-space-600/80'
                        }`}
                      >
                        <span className="font-medium">{shipConfigLookup.get(s.ship_config_id)?.name_key || s.ship_config_id}</span>
                        <span className="text-slate-500 ml-2 text-xs">⛽ {s.fuel_current} · ⚡ {Math.round(s.stability)}%</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {/* Tier filter */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {Array.from({ length: maxTier }, (_, i) => i + 1).map((tier) => {
          const count = zones.filter((z) => z.tier === tier).length
          const active = tierFilter === tier
          return (
            <motion.button
              key={tier}
              variants={scaleIn}
              onClick={() => setTierFilter(tier)}
              className={`relative px-4 py-2 rounded-xl text-xs font-display uppercase tracking-wider border transition whitespace-nowrap ${
                active ? `${tierColors[tier]} ${tierBg[tier]}` : 'text-slate-500 border-white/10 hover:border-white/20'
              }`}
            >
              <span>{tierLabels[tier]}</span>
              <span className="ml-1.5 opacity-60">{count}</span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Zone list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tierFilter}
          className="flex flex-col gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
        >
          {filteredZones.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-slate-500 text-xs">Нет зон этого тира</p>
            </div>
          ) : (
            filteredZones.map((zone, i) => (
              <ZoneCard key={zone.id} zone={zone} onSelect={handleSelectZone} disabled={!selectedShipId || isLoading} index={i} />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
