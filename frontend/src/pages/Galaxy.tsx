import { useState } from 'react'
import { motion } from 'motion/react'

import { ZoneCard } from '../components/ZoneCard'
import { fadeIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Zone } from '../types'

const ZONES: Zone[] = [
  {
    id: 'zone_nebula_alpha', name_key: 'Туманность Альфа', tier: 1, risk_factor: 0.1,
    duration_hours: 4, fuel_cost: 10,
    loot_table: [
      { item_id: 'elem_hydrogen', weight: 40, min: 1, max: 3 },
      { item_id: 'elem_helium', weight: 30, min: 1, max: 2 },
      { item_id: 'fuel_refined', weight: 30, min: 5, max: 15 },
    ],
  },
  {
    id: 'zone_asteroid_belt', name_key: 'Пояс Астероидов', tier: 1, risk_factor: 0.15,
    duration_hours: 6, fuel_cost: 15,
    loot_table: [
      { item_id: 'elem_iron', weight: 40, min: 1, max: 4 },
      { item_id: 'elem_silicon', weight: 30, min: 1, max: 3 },
      { item_id: 'fuel_refined', weight: 20, min: 5, max: 10 },
      { item_id: 'elem_carbon', weight: 10, min: 1, max: 2 },
    ],
  },
  {
    id: 'zone_void_expanse', name_key: 'Пустота', tier: 2, risk_factor: 0.25,
    duration_hours: 8, fuel_cost: 25,
    loot_table: [
      { item_id: 'elem_titanium', weight: 35, min: 1, max: 3 },
      { item_id: 'elem_iron', weight: 25, min: 2, max: 5 },
      { item_id: 'fuel_refined', weight: 20, min: 10, max: 20 },
      { item_id: 'scr_ancient_chip', weight: 20, min: 1, max: 1 },
    ],
  },
  {
    id: 'zone_crystal_caverns', name_key: 'Кристальные Пещеры', tier: 2, risk_factor: 0.3,
    duration_hours: 10, fuel_cost: 30,
    loot_table: [
      { item_id: 'elem_quantum_crystal', weight: 25, min: 1, max: 2 },
      { item_id: 'elem_silicon', weight: 30, min: 2, max: 5 },
      { item_id: 'elem_uranium', weight: 20, min: 1, max: 2 },
      { item_id: 'fuel_refined', weight: 25, min: 10, max: 25 },
    ],
  },
  {
    id: 'zone_quantum_storm', name_key: 'Квантовый Шторм', tier: 3, risk_factor: 0.45,
    duration_hours: 14, fuel_cost: 50,
    loot_table: [
      { item_id: 'elem_dark_matter', weight: 20, min: 1, max: 2 },
      { item_id: 'elem_void_essence', weight: 15, min: 1, max: 1 },
      { item_id: 'elem_quantum_crystal', weight: 25, min: 1, max: 3 },
      { item_id: 'elem_uranium', weight: 25, min: 2, max: 4 },
      { item_id: 'fuel_refined', weight: 15, min: 20, max: 40 },
    ],
  },
]

export function Galaxy() {
  const { ships, startExpedition, isLoading } = useGameStore()
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null)

  const idleShips = ships.filter((s) => s.status === 'idle')

  const handleSelectZone = async (zone: Zone) => {
    if (!selectedShipId) return
    await startExpedition(selectedShipId, zone.id)
  }

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-purple">Галактика</h1>
        <p className="text-xs text-slate-500 mt-1">Выбери зону для исследования</p>
      </motion.header>

      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-4">
        <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 block">Корабль</label>
        <select
          value={selectedShipId || ''}
          onChange={(e) => setSelectedShipId(e.target.value || null)}
          className="w-full glass-card px-3 py-2.5 text-sm text-slate-300 appearance-none cursor-pointer"
        >
          <option value="" className="bg-space-800">Выбери корабль...</option>
          {idleShips.map((s) => (
            <option key={s.id} value={s.id} className="bg-space-800">
              {s.ship_config_id.replace(/_/g, ' ')} — ⛽ {s.fuel_current}
            </option>
          ))}
        </select>
        {idleShips.length === 0 && (
          <p className="text-[10px] text-neon-amber/70 mt-2">Все корабли заняты</p>
        )}
      </motion.div>

      <motion.div
        className="flex flex-col gap-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {ZONES.map((zone, i) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            onSelect={handleSelectZone}
            disabled={!selectedShipId || isLoading}
            index={i}
          />
        ))}
      </motion.div>
    </div>
  )
}
