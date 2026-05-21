import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { ZoneCard } from '../components/ZoneCard'
import { fadeIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Zone } from '../types'

const ZONES: Zone[] = [
  {
    id: 'zone_nebula_alpha', name_key: 'Туманность Альфа',
    description_key: 'Разреженное облако ионизированного газа на окраине сектора. Безопасная зона для начинающих исследователей.',
    tier: 1, risk_factor: 0.1, duration_hours: 4, fuel_cost: 10,
    loot_table: [
      { item_id: 'elem_hydrogen', weight: 40, min: 1, max: 3 },
      { item_id: 'elem_helium', weight: 30, min: 1, max: 2 },
      { item_id: 'fuel_refined', weight: 30, min: 5, max: 15 },
    ],
  },
  {
    id: 'zone_asteroid_belt', name_key: 'Пояс Астероидов',
    description_key: 'Густое скопление каменных и металлических астероидов. Богатый источник редкоземельных элементов.',
    tier: 1, risk_factor: 0.15, duration_hours: 6, fuel_cost: 15,
    loot_table: [
      { item_id: 'elem_iron', weight: 40, min: 1, max: 4 },
      { item_id: 'elem_silicon', weight: 30, min: 1, max: 3 },
      { item_id: 'fuel_refined', weight: 20, min: 5, max: 10 },
      { item_id: 'elem_carbon', weight: 10, min: 1, max: 2 },
    ],
  },
  {
    id: 'zone_void_expanse', name_key: 'Пустота',
    description_key: 'Аномальная область пространства с пониженной гравитацией. Здесь найдены следы древних цивилизаций.',
    tier: 2, risk_factor: 0.25, duration_hours: 8, fuel_cost: 25,
    loot_table: [
      { item_id: 'elem_titanium', weight: 35, min: 1, max: 3 },
      { item_id: 'elem_iron', weight: 25, min: 2, max: 5 },
      { item_id: 'fuel_refined', weight: 20, min: 10, max: 20 },
      { item_id: 'scr_ancient_chip', weight: 20, min: 1, max: 1 },
    ],
  },
  {
    id: 'zone_crystal_caverns', name_key: 'Кристальные Пещеры',
    description_key: 'Сеть гигантских пещер в астероиде, стены которых состоят из чистых квантовых кристаллов.',
    tier: 2, risk_factor: 0.3, duration_hours: 10, fuel_cost: 30,
    loot_table: [
      { item_id: 'elem_quantum_crystal', weight: 25, min: 1, max: 2 },
      { item_id: 'elem_silicon', weight: 30, min: 2, max: 5 },
      { item_id: 'elem_uranium', weight: 20, min: 1, max: 2 },
      { item_id: 'fuel_refined', weight: 25, min: 10, max: 25 },
    ],
  },
  {
    id: 'zone_quantum_storm', name_key: 'Квантовый Шторм',
    description_key: 'Зона пространственно-временной нестабильности. Только самые отважные пилоты рискуют войти сюда.',
    tier: 3, risk_factor: 0.45, duration_hours: 14, fuel_cost: 50,
    loot_table: [
      { item_id: 'elem_dark_matter', weight: 20, min: 1, max: 2 },
      { item_id: 'elem_void_essence', weight: 15, min: 1, max: 1 },
      { item_id: 'elem_quantum_crystal', weight: 25, min: 1, max: 3 },
      { item_id: 'elem_uranium', weight: 25, min: 2, max: 4 },
      { item_id: 'fuel_refined', weight: 15, min: 20, max: 40 },
    ],
  },
]

const ships: Record<string, string> = {
  ship_scout_t1: 'Разведчик MK-I',
  ship_freighter_t2: 'Грузовой «Баржа»',
  ship_corvette_t3: 'Корвет «Молния»',
  ship_cruiser_t4: 'Крейсер «Горизонт»',
  ship_dreadnought_t5: 'Дредноут «Творец»',
}

export function Galaxy() {
  const { ships: userShips, startExpedition, isLoading } = useGameStore()
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
                  <p className="text-sm font-medium">{ships[selectedShip.ship_config_id] || selectedShip.ship_config_id}</p>
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
                        <span className="font-medium">{ships[s.ship_config_id] || s.ship_config_id}</span>
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
      <motion.div className="flex flex-col gap-3" variants={staggerContainer} initial="hidden" animate="visible">
        {ZONES.map((zone, i) => (
          <ZoneCard key={zone.id} zone={zone} onSelect={handleSelectZone} disabled={!selectedShipId || isLoading} index={i} />
        ))}
      </motion.div>
    </div>
  )
}
