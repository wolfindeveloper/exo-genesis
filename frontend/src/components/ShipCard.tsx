import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'

import { cardHover } from '../lib/animations'
import { useExpeditionTimer } from '../hooks/useTimer'
import { useGameStore } from '../store/game'
import type { Resource, Ship, ShipConfig } from '../types'

const statusConfig: Record<string, { label: string; cls: string }> = {
  idle: { label: 'Готов', cls: 'bg-neon-green/10 text-neon-green border border-neon-green/20' },
  expedition: { label: 'В полёте', cls: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' },
  repair: { label: 'Ремонт', cls: 'bg-neon-amber/10 text-neon-amber border border-neon-amber/20' },
}

const completeBadge = { label: '🎁 Забрать', cls: 'bg-neon-green text-black border border-neon-green font-bold' }

const tierColors = ['', '#22d3ee', '#22c55e', '#a855f7', '#f59e0b', '#ef4444']
const tierGradients = [
  '',
  'linear-gradient(135deg, #0891b2 0%, #0284c7 50%, #0e7490 100%)',
  'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
  'linear-gradient(135deg, #9333ea 0%, #7e22ce 50%, #6b21a8 100%)',
  'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)',
  'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
]

function stabilityColor(pct: number): string {
  if (pct > 60) return '#22c55e'
  if (pct > 30) return '#eab308'
  return '#ef4444'
}

interface ShipCardProps {
  ship: Ship
  config: ShipConfig | null
  index?: number
  onTap: (ship: Ship) => void
}

export const ShipCard = memo(function ShipCard({ ship, config, index = 0, onTap }: ShipCardProps) {
  const [imgError, setImgError] = useState(false)
  const wasComplete = useRef(false)

  const tier = config?.tier || parseInt(ship.ship_config_id.match(/t(\d)/)?.[1] || '1')
  const name = config?.name_key || ship.ship_config_id.replace(/_/g, ' ')
  const st = statusConfig[ship.status] || statusConfig.idle
  const fuelMax = config?.stats?.fuel_capacity || 50
  const fuelPct = Math.min((ship.fuel_current / fuelMax) * 100, 100)

  // Pills for refuel / repair
  const inventory = useGameStore((s) => s.inventory)
  const resourcesContent = useGameStore((s) => s.resourcesContent)
  const doRefuel = useGameStore((s) => s.refuelShip)
  const doRepair = useGameStore((s) => s.repairShip)

  const isIdle = ship.status === 'idle'
  const repairResource: Resource | undefined = useMemo(() => {
    if (!isIdle || !config) return undefined
    return resourcesContent.find((r) => r.id === `repair_kit_t${tier}`)
  }, [isIdle, config, resourcesContent, tier])
  const fuelResource: Resource | undefined = useMemo(() => {
    if (!isIdle || !config) return undefined
    return resourcesContent.find((r) => r.id === `fuel_t${tier}`)
  }, [isIdle, config, resourcesContent, tier])
  const hasRepairKit = useMemo(() => {
    if (!repairResource) return false
    return inventory.some((i) => i.item_config_id === repairResource.id && i.quantity > 0)
  }, [repairResource, inventory])
  const hasFuel = useMemo(() => {
    if (!fuelResource) return false
    return inventory.some((i) => i.item_config_id === fuelResource.id && i.quantity > 0)
  }, [fuelResource, inventory])

  const actionLock = useRef(false)

  const handleRepair = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (actionLock.current || !repairResource) return
    actionLock.current = true
    doRepair(ship.id, repairResource.id).finally(() => { actionLock.current = false })
  }, [repairResource, doRepair, ship.id])

  const handleRefuel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (actionLock.current || !fuelResource) return
    actionLock.current = true
    doRefuel(ship.id, fuelResource.id).finally(() => { actionLock.current = false })
  }, [fuelResource, doRefuel, ship.id])

  // Live timer for expedition ships
  const activeExpeditions = useGameStore((s) => s.activeExpeditions)
  const addPendingClaim = useGameStore((s) => s.addPendingClaim)
  const myExp = ship.status === 'expedition'
    ? (activeExpeditions.find((e) => e.ship_id === ship.id) ?? null)
    : null
  const timer = useExpeditionTimer(myExp?.start_time ?? null, myExp?.end_time ?? null)
  const isComplete = timer?.isComplete ?? false

  // Auto-detect first transition to complete — add to pending claims
  const mountTime = useRef(Date.now())

  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      wasComplete.current = true
      const completedDuringSession = !!(myExp && new Date(myExp.end_time).getTime() > mountTime.current)
      addPendingClaim(ship.id, name, completedDuringSession)
    }
    if (!isComplete) wasComplete.current = false
  }, [isComplete, ship.id, name, addPendingClaim, myExp])

  const badge = isComplete ? completeBadge : st

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: isComplete
          ? ['0 0 12px rgba(34,197,94,0.15), inset 0 0 12px rgba(34,197,94,0.08)', '0 0 24px rgba(34,197,94,0.3), inset 0 0 20px rgba(34,197,94,0.12)', '0 0 12px rgba(34,197,94,0.15), inset 0 0 12px rgba(34,197,94,0.08)']
          : `${tierColors[tier]}33`,
      }}
      transition={{
        opacity: { delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 },
        y: { delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 },
        boxShadow: { duration: 2, repeat: isComplete ? Infinity : 0, ease: 'easeInOut' },
      }}
      {...cardHover}
      className="glass-card overflow-hidden cursor-pointer"
      style={{
        borderColor: isComplete ? '#22c55e66' : `${tierColors[tier]}33`,
      }}
      onClick={() => onTap(ship)}
    >
      <div className="relative h-32 bg-space-900/60 overflow-hidden">
        {config?.art_path && !imgError ? (
          <img
            src={config.art_path}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: tierGradients[tier] }}
          >
            <span className="text-5xl opacity-30">🚀</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/20 to-transparent" />
        <motion.span
          animate={isComplete ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute top-2 right-2 text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider ${badge.cls}`}
        >
          {timer ? timer.display : st.label}
        </motion.span>
        <div className="absolute bottom-2 left-3 flex gap-1">
          {Array.from({ length: tier }, (_, i) => (
            <span key={i} className="text-xs drop-shadow-lg" style={{ color: tierColors[tier] }}>★</span>
          ))}
        </div>
      </div>

      <div className="p-3 pt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-sm uppercase tracking-wider text-slate-300 truncate">{name}</h3>
          {ship.equipped_artifacts.length > 0 && (
            <span className="text-[9px] text-neon-purple/70 ml-2 shrink-0">
              ✦ {ship.equipped_artifacts.length}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 uppercase tracking-wider">Прочность</span>
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                {ship.stability}%
                {isIdle && ship.stability < 100 && hasRepairKit && (
                  <button onClick={handleRepair} className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-amber/15 text-neon-amber border border-neon-amber/30 hover:bg-neon-amber/25 leading-none">+🔧</button>
                )}
              </span>
            </div>
            <div className="relative h-5 bg-space-500 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full flex items-center justify-end pr-1.5"
                initial={{ width: 0 }}
                animate={{ width: `${ship.stability}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                style={{ backgroundColor: stabilityColor(ship.stability) }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 uppercase tracking-wider">Топливо</span>
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                {ship.fuel_current}/{fuelMax}
                {isIdle && ship.fuel_current < fuelMax && hasFuel && (
                  <button onClick={handleRefuel} className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-amber/15 text-neon-amber border border-neon-amber/30 hover:bg-neon-amber/25 leading-none">+⛽</button>
                )}
              </span>
            </div>
            <div className="relative h-5 bg-space-500 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full flex items-center justify-end pr-1.5"
                initial={{ width: 0 }}
                animate={{ width: `${fuelPct}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                style={{ backgroundColor: '#f59e0b' }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})
