import { motion } from 'motion/react'

import { cardHover } from '../lib/animations'
import type { Ship } from '../types'

const ships: Record<string, { name: string; desc: string }> = {
  ship_scout_t1: { name: 'Разведчик MK-I', desc: 'Лёгкий разведывательный корабль' },
  ship_freighter_t2: { name: 'Грузовой «Баржа»', desc: 'Прочный транспортировщик' },
  ship_corvette_t3: { name: 'Корвет «Молния»', desc: 'Быстрый маневренный корвет' },
  ship_cruiser_t4: { name: 'Крейсер «Горизонт»', desc: 'Тяжёлый крейсер дальнего радиуса' },
  ship_dreadnought_t5: { name: 'Дредноут «Творец»', desc: 'Легендарный флагманский дредноут' },
}

const tierColors = ['', '#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']

const statusConfig: Record<string, { label: string; cls: string }> = {
  idle: { label: 'Готов', cls: 'bg-neon-green/10 text-neon-green border border-neon-green/20' },
  expedition: { label: 'В полёте', cls: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' },
  repair: { label: 'Ремонт', cls: 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20' },
}

export function ShipCard({ ship, index = 0 }: { ship: Ship; index?: number }) {
  const tier = parseInt(ship.ship_config_id.match(/t(\d)/)?.[1] || '1')
  const sd = ships[ship.ship_config_id]
  const st = statusConfig[ship.status] || statusConfig.idle

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
      {...cardHover}
      className="glass-card p-4"
      style={{ borderColor: `${tierColors[tier]}33`, boxShadow: `0 0 12px ${tierColors[tier]}15, inset 0 0 12px ${tierColors[tier]}08` }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-display text-sm uppercase tracking-wider text-slate-300">{sd?.name || ship.ship_config_id}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">{sd?.desc || ''}</p>
          <div className="flex gap-1 mt-1.5">
            {Array.from({ length: tier }, (_, i) => (
              <span key={i} className="text-xs" style={{ color: tierColors[tier] }}>★</span>
            ))}
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${st.cls}`}>
          {st.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
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
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">ID</span>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5 truncate">{ship.id.slice(0, 8)}</p>
        </div>
      </div>
    </motion.div>
  )
}
