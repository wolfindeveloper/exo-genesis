import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router-dom'

import { ZoneCard } from '../components/ZoneCard'
import { ZoneModal } from '../components/ZoneModal'
import { fadeIn, scaleIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Zone } from '../types'

const tierLabels = ['', 'T1', 'T2', 'T3', 'T4', 'T5']
const tierColors = ['', 'text-neon-cyan border-neon-cyan/30', 'text-neon-green border-neon-green/30', 'text-neon-purple border-neon-purple/30', 'text-neon-amber border-neon-amber/30', 'text-neon-red border-neon-red/30']
const tierBg = ['', 'bg-neon-cyan/10', 'bg-neon-green/10', 'bg-neon-purple/10', 'bg-neon-amber/10', 'bg-neon-red/10']

export function Galaxy() {
  const { zonesContent: zones, startExpedition, isLoading } = useGameStore()
  const [tierFilter, setTierFilter] = useState(1)
  const [zoneModal, setZoneModal] = useState<Zone | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const maxTier = Math.max(...zones.map((z) => z.tier), 1)
  const filteredZones = zones.filter((z) => z.tier === tierFilter)

  // Pre-selected ship from Hangar flow
  const preselectedShipId = searchParams.get('ship') || undefined

  const handleStartFromModal = async (shipId: string) => {
    if (!zoneModal) return
    await startExpedition(shipId, zoneModal.id)
    setZoneModal(null)
    setSearchParams({}, { replace: true })
  }

  const handleZoneSelect = (zone: Zone) => {
    setZoneModal(zone)
  }

  const handleCloseModal = () => {
    setZoneModal(null)
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-5" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-purple">Галактика</h1>
        <p className="text-xs text-slate-500 mt-1">Нажми на зону для просмотра</p>
      </motion.header>

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
              <ZoneCard key={zone.id} zone={zone} onSelect={() => handleZoneSelect(zone)} index={i} />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Zone modal */}
      <AnimatePresence>
        {zoneModal && (
          <ZoneModal
            zone={zoneModal}
            onClose={handleCloseModal}
            onStart={handleStartFromModal}
            isLoading={isLoading}
            preselectedShipId={preselectedShipId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
