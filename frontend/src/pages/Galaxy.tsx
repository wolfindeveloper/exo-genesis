import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { ZoneCard } from '../components/ZoneCard'
import { fadeIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Zone } from '../types'

const shipNames: Record<string, string> = {
  ship_scout_t1: 'Разведчик MK-I',
  ship_freighter_t2: 'Грузовой «Баржа»',
  ship_corvette_t3: 'Корвет «Молния»',
  ship_cruiser_t4: 'Крейсер «Горизонт»',
  ship_dreadnought_t5: 'Дредноут «Творец»',
}

export function Galaxy() {
  const { ships: userShips, zonesContent: zones, startExpedition, isLoading } = useGameStore()
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)
  const [showShipPicker, setShowShipPicker] = useState(false)

  const idleShips = userShips.filter((s) => s.status === 'idle')
  const selectedShip = idleShips.find((s) => s.id === selectedShipId)

  const handleSelectZone = async (zone: Zone) => {
    if (!selectedShipId) return
    await startExpedition(selectedShipId, zone.id)
  }

  return (
    <div className="p-4 pb-4">
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
                  <p className="text-sm font-medium">{shipNames[selectedShip.ship_config_id] || selectedShip.ship_config_id}</p>
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
                        <span className="font-medium">{shipNames[s.ship_config_id] || s.ship_config_id}</span>
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

      {/* Zone list */}
      {zones.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-slate-500 text-xs">Загрузка карты...</p>
        </div>
      ) : (
        <motion.div className="flex flex-col gap-3" variants={staggerContainer} initial="hidden" animate="visible">
          {zones.map((zone, i) => (
            <ZoneCard key={zone.id} zone={zone} onSelect={handleSelectZone} disabled={!selectedShipId || isLoading} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
