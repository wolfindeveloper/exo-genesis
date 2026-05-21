import { useEffect } from 'react'
import { motion } from 'motion/react'

import { ShipCard } from '../components/ShipCard'
import { fadeIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'

export function Hangar() {
  const { ships, loadShips, isLoading } = useGameStore()

  useEffect(() => { loadShips() }, [])

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-cyan">Ангар</h1>
        <p className="text-xs text-slate-500 mt-1">Твой флот</p>
      </motion.header>

      {isLoading && ships.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer rounded-xl h-28" />
          ))}
        </div>
      ) : ships.length === 0 ? (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="glass-card p-8 text-center">
          <p className="text-slate-400 mb-2 font-display text-sm uppercase tracking-wider">Нет кораблей</p>
          <p className="text-xs text-slate-500">Купи первый корабль, чтобы начать исследования</p>
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
