import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { ShipCard } from '../components/ShipCard'
import { ShipDetailModal } from '../components/ShipDetailModal'
import { fadeIn, scaleIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Ship, ShipConfig } from '../types'

const tierLabels = ['', 'T1', 'T2', 'T3', 'T4', 'T5']
const tierColors = ['', 'text-neon-cyan border-neon-cyan/30', 'text-neon-green border-neon-green/30', 'text-neon-purple border-neon-purple/30', 'text-neon-amber border-neon-amber/30', 'text-neon-red border-neon-red/30']
const tierBg = ['', 'bg-neon-cyan/10', 'bg-neon-green/10', 'bg-neon-purple/10', 'bg-neon-amber/10', 'bg-neon-red/10']

export function Hangar() {
  const { ships, shipsContent, loadShips, isLoading } = useGameStore()
  const [tierFilter, setTierFilter] = useState(1)
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
  const navigate = useNavigate()

  useEffect(() => { loadShips() }, [])

  const shipConfigLookup = useMemo(() => new Map(shipsContent.map((s) => [s.id, s])), [shipsContent])

  const shipsWithTier = useMemo(() => ships.map((s) => ({
    ...s,
    tier: shipConfigLookup.get(s.ship_config_id)?.tier || 1,
  })), [ships, shipConfigLookup])

  const availTiers = useMemo(
    () => [...new Set(shipsWithTier.map((s) => s.tier))].sort(),
    [shipsWithTier],
  )
  const filteredShips = useMemo(
    () => shipsWithTier.filter((s) => s.tier === tierFilter),
    [shipsWithTier, tierFilter],
  )

  const idleCount = useMemo(() => ships.filter((s) => s.status === 'idle').length, [ships])
  const onMission = useMemo(() => ships.length - idleCount, [ships.length, idleCount])

  const handleShipTap = useCallback((ship: Ship) => setSelectedShip(ship), [])
  const handleCloseModal = useCallback(() => setSelectedShip(null), [])

  const filteredShipConfigs = useMemo(() => {
    const m = new Map<string, ShipConfig | undefined>()
    for (const s of filteredShips) {
      m.set(s.id, shipConfigLookup.get(s.ship_config_id))
    }
    return m
  }, [filteredShips, shipConfigLookup])

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-cyan">Ангар</h1>
        <div className="flex gap-3 mt-2">
          <span className="text-[11px] text-slate-500">
            🚀 {ships.length} кораблей
          </span>
          {idleCount > 0 && (
            <span className="text-[11px] text-neon-green/70">
              ✅ {idleCount} готовы
            </span>
          )}
          {onMission > 0 && (
            <span className="text-[11px] text-neon-cyan/70">
              🌌 {onMission} в полёте
            </span>
          )}
        </div>
      </motion.header>

      {/* Tier filter */}
      {availTiers.length > 1 && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {availTiers.map((tier) => {
            const count = shipsWithTier.filter((s) => s.tier === tier).length
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
      )}

      {isLoading && ships.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer rounded-xl h-28" />
          ))}
        </div>
      ) : ships.length === 0 ? (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="glass-card p-10 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <p className="text-slate-400 mb-1 font-display text-sm uppercase tracking-wider">Ангар пуст</p>
          <p className="text-xs text-slate-500">Приобрети корабль, чтобы начать исследования</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tierFilter}
            className="flex flex-col gap-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
          >
            {filteredShips.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-slate-500 text-xs">Нет кораблей этого тира</p>
              </div>
            ) : (
              filteredShips.map((ship, i) => (
                <ShipCard
                  key={ship.id}
                  ship={ship}
                  config={filteredShipConfigs.get(ship.id) || null}
                  index={i}
                  onTap={handleShipTap}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Ship detail modal */}
      <AnimatePresence>
        {selectedShip && (
          <ShipDetailModal
            ship={selectedShip}
            config={shipConfigLookup.get(selectedShip.ship_config_id) || null}
            onClose={handleCloseModal}
            onSend={() => { handleCloseModal(); navigate(`/galaxy?ship=${selectedShip.id}`) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
