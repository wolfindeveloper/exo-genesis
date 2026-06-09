import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'

import { calculateZoneStats } from '../lib/expeditionCalc'
import { statLabels } from '../lib/stats'
import { useGameStore } from '../store/game'
import type { Zone } from '../types'

const tierGradients = [
  '',
  'from-neon-cyan/30 via-space-800 to-space-950',
  'from-neon-green/30 via-space-800 to-space-950',
  'from-neon-purple/30 via-space-800 to-space-950',
  'from-neon-amber/30 via-space-800 to-space-950',
  'from-neon-red/30 via-space-800 to-space-950',
]

const tierAccent = ['', 'text-neon-cyan', 'text-neon-green', 'text-neon-purple', 'text-neon-amber', 'text-neon-red']

const zoneEmoji: Record<string, string> = {
  the_outskirts_of_sanity: '🌌',
  scrap_yard: '🗑️',
  nebula_warm_tea: '🍵',
  the_belt_of_statistical_errors: '☄️',
  the_edge_of_nowhere_filling_station: '⛽',
  the_syntax_error_nebula: '💻',
  the_lost_sock_archipelago: '🧦',
  the_terminal_of_eternal_queue: '⌛',
  the_zone_of_mild_inconvenience: '😤',
  the_planet_echo_monday: '📅',
  'the_credit-score_black_hole': '💳',
  "the_schrödinger's_sector": '📦',
  the_archive_of_all_mistakes: '📚',
  the_nebula_of_twisted_recalls: '🌀',
  the_zero_meridian_of_absurdity: '⏳',
  the_zenith_of_status: '👑',
  the_sector_of_singularity_architects: '🏛️',
  the_library_of_great_deals: '📖',
  the_cloud_of_pure_ether: '☁️',
  'the_planet_of_ego-olympus': '🏔️',
  the_administrative_singularity: '🗑️',
  the_boardroom_of_creation: '🪑',
  the_nebula_of_random_epiphany: '💡',
  the_planet_of_placebo_effect: '💊',
  the_end_of_shift_station: '🌆',
}

interface ZoneModalProps {
  zone: Zone
  onClose: () => void
  onStart: () => void
  isLoading: boolean
}

export function ZoneModal({ zone, onClose, onStart, isLoading }: ZoneModalProps) {
  const ships = useGameStore((s) => s.ships)
  const shipsContent = useGameStore((s) => s.shipsContent)
  const resourcesContent = useGameStore((s) => s.resourcesContent)
  const artifactsContent = useGameStore((s) => s.artifactsContent)
  const loadShips = useGameStore((s) => s.loadShips)
  const [confirming, setConfirming] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (ships.length === 0) loadShips()
  }, [])

  const shipConfigLookup = useMemo(() => new Map(shipsContent.map((s) => [s.id, s])), [shipsContent])
  const lootNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of resourcesContent) m.set(r.id, r.name_key)
    for (const a of artifactsContent) m.set(a.id, a.name_key)
    return m
  }, [resourcesContent, artifactsContent])
  const totalWeight = useMemo(
    () => zone.loot_table.reduce((s, l) => s + l.weight, 0),
    [zone.loot_table],
  )

  const mainShip = ships[0] ?? null
  const shipConfig = mainShip ? shipConfigLookup.get(mainShip.ship_config_id) : null
  const eff = mainShip?.effective_stats
  const speedMod = shipConfig?.stats?.speed_mod ?? 1.0

  const artifactBonuses = useMemo(() => {
    if (!eff) return []
    const mods: Record<string, number> = {}
    if (eff.total_speed_bonus) mods.speed_mod = eff.total_speed_bonus
    if (eff.damage_reduction) mods.damage_reduction = eff.damage_reduction
    if (eff.total_fuel_efficiency) mods.fuel_efficiency = eff.total_fuel_efficiency
    return Object.keys(mods).length > 0 ? [mods] : []
  }, [eff])

  const calcedStats = useMemo(() => {
    if (!mainShip) return null
    return calculateZoneStats(
      zone.risk_factor,
      zone.fuel_cost,
      zone.duration_hours,
      mainShip.stability,
      speedMod,
      mainShip.fuel_current,
      artifactBonuses,
    )
  }, [mainShip, speedMod, zone, artifactBonuses])

  const canLaunch = mainShip && mainShip.status === 'idle' && calcedStats?.fuelOk

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

        <div className={`relative aspect-[3/2] ${zone.icon_path && !imgError ? '' : `bg-gradient-to-br ${tierGradients[zone.tier]}`} overflow-hidden`}>
          {zone.icon_path && !imgError ? (
            <img
              src={zone.icon_path}
              alt={zone.name_key}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${tierGradients[zone.tier]} flex items-center justify-center`}>
              <div className="text-center">
                <motion.div
                  className="text-5xl mb-1"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  {zoneEmoji[zone.id] || '🌌'}
                </motion.div>
                <h2 className={`font-display text-sm uppercase tracking-[0.15em] ${tierAccent[zone.tier]}`}>{zone.name_key}</h2>
                <span className="text-[10px] text-white/40 font-display uppercase tracking-wider mt-0.5 block">Tier {zone.tier}</span>
              </div>
            </div>
          )}
          {zone.icon_path && !imgError && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-space-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-5">
                <h2 className={`font-display text-sm uppercase tracking-[0.15em] drop-shadow-lg ${tierAccent[zone.tier]}`}>{zone.name_key}</h2>
                <span className="text-[10px] text-white/50 font-display uppercase tracking-wider mt-0.5 block drop-shadow">Tier {zone.tier}</span>
              </div>
            </>
          )}
        </div>

        <div className="p-5 space-y-5 pb-24">
          <p className="text-xs text-slate-400 leading-relaxed">{zone.description_key}</p>

          <div>
            <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Характеристики</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '⛽ Топливо', base: zone.fuel_cost, calc: calcedStats?.effectiveFuelCost },
                { label: '⏱ Время', base: `${zone.duration_hours}ч`, calc: calcedStats ? `${calcedStats.durationHours}ч` : null },
                { label: '⚠ Риск', base: `${Math.round(zone.risk_factor * 100)}%`, calc: calcedStats ? `${calcedStats.riskPercent}%` : null },
              ].map((item) => (
                <div key={item.label} className="glass-card p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">{item.label}</p>
                  <p className="text-sm font-display text-slate-300">{item.base}</p>
                  {item.calc && (
                    <p className={`text-[10px] mt-0.5 font-display ${tierAccent[zone.tier]}`}>
                      {item.calc}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {artifactBonuses.length > 0 && (
            <div>
              <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Бонусы артефактов</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(artifactBonuses[0]).map(([key, val]) => {
                  const color =
                    key === 'speed_mod' ? 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/10'
                    : key === 'damage_reduction' ? 'text-neon-green border-neon-green/20 bg-neon-green/10'
                    : key === 'fuel_efficiency' ? 'text-neon-amber border-neon-amber/20 bg-neon-amber/10'
                    : 'text-slate-400 border-white/10 bg-white/5'
                  return (
                    <span key={key} className={`text-[10px] px-2 py-1 rounded-md border ${color}`}>
                      {statLabels[key] || key} {val > 0 ? '+' : ''}{val}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {calcedStats && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Макс. повреждение</span>
              <span className="font-display text-neon-red">-{calcedStats.estimatedMaxDamage.toFixed(1)}% прочности</span>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Возможная добыча</h4>
            <div className="flex flex-wrap gap-1.5">
              {zone.loot_table.map((loot) => (
                  <span key={loot.item_id} className="text-[10px] bg-space-700/50 px-2.5 py-1 rounded-full text-slate-400 border border-white/5">
                    📦 {lootNames.get(loot.item_id) || loot.item_id} {Math.round(loot.weight / totalWeight * 100)}% {loot.min}–{loot.max}шт
                  </span>
                ))}
            </div>
          </div>

          {!mainShip && (
            <p className="text-xs text-neon-amber/70 text-center">Нет корабля</p>
          )}
          {mainShip && mainShip.status !== 'idle' && (
            <p className="text-xs text-neon-amber/70 text-center">Корабль в полёте</p>
          )}
          {mainShip && mainShip.status === 'idle' && calcedStats && !calcedStats.fuelOk && (
            <p className="text-xs text-neon-red text-center">Недостаточно ⛽ для запуска</p>
          )}

          {confirming && canLaunch ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3.5 rounded-xl font-display text-sm uppercase tracking-wider transition border border-white/10 text-slate-400 hover:bg-space-700/50"
              >
                ← Отмена
              </button>
              <button
                disabled={isLoading}
                onClick={onStart}
                className="flex-[2] py-3.5 rounded-xl font-display text-sm uppercase tracking-wider transition disabled:opacity-30 bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80 hover:from-neon-purple hover:to-neon-cyan"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>◌</motion.span>
                    Старт...
                  </span>
                ) : (
                  '🚀 Точно запустить'
                )}
              </button>
            </div>
          ) : (
            <button
              disabled={!canLaunch || isLoading}
              onClick={() => setConfirming(true)}
              className="btn-glow w-full py-3.5 rounded-xl font-display text-sm uppercase tracking-wider transition disabled:opacity-30 bg-gradient-to-r from-neon-purple/80 to-neon-cyan/80 hover:from-neon-purple hover:to-neon-cyan"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>◌</motion.span>
                  Старт...
                </span>
              ) : !calcedStats ? (
                'Загрузка...'
              ) : !calcedStats.fuelOk ? (
                'Недостаточно ⛽'
              ) : mainShip?.status !== 'idle' ? (
                'Корабль занят'
              ) : (
                '🚀 Запуск'
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
