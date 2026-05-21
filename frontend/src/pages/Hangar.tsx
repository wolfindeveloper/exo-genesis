import { useEffect } from 'react'
import { motion } from 'motion/react'

import { ShipCard } from '../components/ShipCard'
import { fadeIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'

export function Hangar() {
  const { ships, loadShips, isLoading } = useGameStore()

  useEffect(() => { loadShips() }, [])

  const idleCount = ships.filter((s) => s.status === 'idle').length
  const onMission = ships.length - idleCount

  return (
    <div className="p-4 pb-4">
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
        <motion.div className="flex flex-col gap-3" variants={staggerContainer} initial="hidden" animate="visible">
          {ships.map((ship, i) => (
            <ShipCard key={ship.id} ship={ship} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
