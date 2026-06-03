import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { fadeIn, scaleIn, staggerContainer } from '../lib/animations'
import { useGameStore } from '../store/game'
import type { Artifact, InventoryItem, Resource } from '../types'

const rarityConfig: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: 'border-slate-500/20', bg: 'bg-slate-500/5', text: 'text-slate-300', glow: 'rgba(100,116,139,0.15)' },
  uncommon: { border: 'border-neon-green/20', bg: 'bg-neon-green/5', text: 'text-neon-green', glow: 'rgba(34,197,94,0.15)' },
  rare: { border: 'border-neon-purple/20', bg: 'bg-neon-purple/5', text: 'text-neon-purple', glow: 'rgba(168,85,247,0.15)' },
  epic: { border: 'border-neon-amber/20', bg: 'bg-neon-amber/5', text: 'text-neon-amber', glow: 'rgba(245,158,11,0.15)' },
  legendary: { border: 'border-neon-red/20', bg: 'bg-neon-red/5', text: 'text-neon-red', glow: 'rgba(239,68,68,0.15)' },
}

const tierBadgeCls = [
  '',
  'border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10',
  'border-neon-green/30 text-neon-green bg-neon-green/10',
  'border-neon-purple/30 text-neon-purple bg-neon-purple/10',
  'border-neon-amber/30 text-neon-amber bg-neon-amber/10',
  'border-neon-red/30 text-neon-red bg-neon-red/10',
]

const typeIcons: Record<string, string> = { element: '🧪', resource: '', artifact: '✨' }
const typeLabels: Record<string, string> = {
  all: 'Всё', element: 'Элементы', resource: 'Ресурсы', artifact: 'Артефакты',
}

const sortLabels: Record<string, string> = { tier: 'T ↑', 'tier-desc': 'T ↓', qty: '× ↓', name: 'А—Я' }

type SortMode = 'tier' | 'tier-desc' | 'qty' | 'name'

const elementEmoji: Record<string, string> = {
  blue_electrical_tape: '🟦', compressed_luck: '🎲', warp_paper_clip: '📎',
  frozen_confusion: '💗', the_battery_will_die_tomorrow: '🔋',
  custom_rivet_set: '🔩', pride_of_cows_liquid_methane: '🐄',
  the_singular_button: '🔘', quick_no_lubricant: '🛢️', reflector_of_views: '✨',
  the_dust_of_paradoxes: '🌫️', logic_gate_inverter: '🔄', chrome_nostalgia: '💿',
  quantum_stabilizer: '⚛️', bergamot_crystal: '🍵',
  essential_oil_condensate: '💧', the_fractal_of_greatness: '🌀',
  fragments_of_a_deal: '📜', condensation_of_possibilities: '💫',
  the_core_of_reality: '🔮',
  "the_universe's_bug_report": '🐛', "the_demiurge's_ink": '🖋️',
  absolute_zero: '❄️', the_holy_spoon: '🥄', the_pen_of_laughter: '🪶',
}

const resourceIcons: Record<string, string> = { fuel: '⛽', repair_kit: '🔧' }

function parseTier(id: string): number {
  const m = id.match(/[tT](\d+)/)
  return m ? parseInt(m[1]) : 1
}

type ItemInfo = {
  name: string
  tier: number
  rarity: string
  icon_path: string
  resource_type?: string
  description_key?: string
}

function buildInfo(item: InventoryItem, resMap: Map<string, Resource>, artMap: Map<string, Artifact>): ItemInfo {
  const r = resMap.get(item.item_config_id)
  if (r) {
    return {
      name: r.name_key ?? item.item_config_id,
      tier: r.tier ?? parseTier(item.item_config_id),
      rarity: 'common',
      icon_path: r.icon_path ?? '',
      resource_type: r.resource_type ?? 'fuel',
      description_key: r.description_key,
    }
  }
  const meta = item.metadata || {}
  if (meta.name_key) {
    return {
      name: meta.name_key as string,
      tier: (meta.tier as number) || 1,
      rarity: (meta.rarity as string) || 'common',
      icon_path: '',
      description_key: (meta.description_key as string) || undefined,
    }
  }
  const a = artMap.get(item.item_config_id)
  if (a) {
    return {
      name: a.name_key ?? item.item_config_id,
      tier: a.tier ?? 1,
      rarity: a.rarity ?? 'common',
      icon_path: '',
      description_key: a.description_key,
    }
  }
  return {
    name: item.item_config_id,
    tier: 1,
    rarity: 'common',
    icon_path: '',
    resource_type: undefined,
  }
}

function buildSections(
  items: InventoryItem[],
  resMap: Map<string, Resource>,
  artMap: Map<string, Artifact>,
  sortMode: SortMode,
): { label: string; icon: string; items: { item: InventoryItem; info: ItemInfo }[] }[] {
  const fuel: InventoryItem[] = []
  const repair: InventoryItem[] = []
  const artifacts: InventoryItem[] = []

  for (const i of items) {
    if (i.item_type === 'resource' && i.item_config_id.startsWith('fuel')) {
      fuel.push(i)
    } else if (i.item_type === 'resource' && i.item_config_id.startsWith('repair_kit')) {
      repair.push(i)
    } else if (i.item_type === 'artifact') {
      artifacts.push(i)
    } else if (resMap.has(i.item_config_id)) {
      const r = resMap.get(i.item_config_id)!
      if (r.resource_type === 'fuel') {
        fuel.push(i)
      } else {
        repair.push(i)
      }
    } else if (artMap.has(i.item_config_id)) {
      artifacts.push(i)
    }
  }

  const groups: { label: string; icon: string; items: InventoryItem[] }[] = []
  if (fuel.length) groups.push({ label: '⛽ Топливо', icon: '⛽', items: fuel })
  if (repair.length) groups.push({ label: '🔧 Ремкомплекты', icon: '🔧', items: repair })
  if (artifacts.length) groups.push({ label: '✨ Артефакты', icon: '✨', items: artifacts })

  const sorter = (a: { item: InventoryItem; info: ItemInfo }, b: { item: InventoryItem; info: ItemInfo }) => {
    switch (sortMode) {
      case 'tier': return a.info.tier - b.info.tier
      case 'tier-desc': return b.info.tier - a.info.tier
      case 'qty': return b.item.quantity - a.item.quantity
      case 'name': return a.info.name.localeCompare(b.info.name)
      default: return 0
    }
  }

  return groups.map((g) => ({
    label: g.label,
    icon: g.icon,
    items: g.items.map((item) => ({ item, info: buildInfo(item, resMap, artMap) })).sort(sorter),
  }))
}

export function Inventory() {
  const { inventory, loadInventory, resourcesContent, artifactsContent, ships, loadShips } = useGameStore()
  const [filter, setFilter] = useState<string>('all')
  const [sortMode, setSortMode] = useState<SortMode>('tier')
  const [selectedItem, setSelectedItem] = useState<{ item: InventoryItem; info: ItemInfo } | null>(null)

  useEffect(() => {
    loadInventory()
    loadShips()
  }, [loadInventory, loadShips])

  const resMap = useMemo(() => new Map(resourcesContent.map((r) => [r.id, r])), [resourcesContent])
  const artMap = useMemo(() => new Map(artifactsContent.map((a) => [a.id, a])), [artifactsContent])

  const types = useMemo(() => ['all', ...new Set(inventory.map((i) => i.item_type))], [inventory])

  const filtered = useMemo(() => {
    if (filter === 'all') return inventory
    return inventory.filter((i) => i.item_type === filter)
  }, [inventory, filter])

  const sections = useMemo(
    () => buildSections(filtered, resMap, artMap, sortMode),
    [filtered, resMap, artMap, sortMode],
  )

  const totalItems = inventory.reduce((s, i) => s + i.quantity, 0)
  const totalUnique = inventory.length

  const usableItems = useMemo(() => {
    const usable = new Set<string>()
    const { shipsContent } = useGameStore.getState()
    for (const ship of ships) {
      if (ship.status !== 'idle') continue
      const tier = parseTier(ship.ship_config_id)
      const cfg = shipsContent.find((c) => c.id === ship.ship_config_id)
      const maxFuel = cfg?.stats?.fuel_capacity ?? 50
      if (ship.fuel_current < maxFuel) {
        usable.add(`fuel_t${tier}`)
      }
      if (ship.stability < 100) {
        usable.add(`repair_kit_t${tier}`)
      }
    }
    return usable
  }, [ships])

  const handleItemTap = useCallback((item: InventoryItem, info: ItemInfo) => {
    setSelectedItem({ item, info })
  }, [])

  const hasItems = sections.length > 0

  const user = useGameStore((s) => s.user)

  return (
    <div className="p-4 pb-28">
      <motion.header className="mb-4" variants={fadeIn} initial="hidden" animate="visible">
        <h1 className="font-display text-lg uppercase tracking-[0.2em] text-neon-green">Инвентарь</h1>
        <p className="text-xs text-slate-500 mt-1">{totalUnique} предметов · {totalItems} ед.</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-amber-400/70 font-mono">📜 Фрагментов бреда: <strong className="text-amber-300">{user?.balance_fragments ?? 0}</strong></span>
        </div>
      </motion.header>

      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-display uppercase tracking-wider transition whitespace-nowrap ${
              filter === t
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                : 'bg-space-700/50 text-slate-500 border border-white/5 hover:border-white/20'
            }`}
          >
            {typeIcons[t] || ''} {typeLabels[t] || t}
          </button>
        ))}
      </motion.div>

      {hasItems && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex gap-1.5 mb-4">
          {(['tier', 'tier-desc', 'qty', 'name'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-2.5 py-1 rounded text-[9px] font-display uppercase tracking-wider transition ${
                sortMode === mode
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                  : 'bg-space-700/30 text-slate-600 border border-white/5 hover:text-slate-400'
              }`}
            >
              {sortLabels[mode]}
            </button>
          ))}
        </motion.div>
      )}

      {!hasItems ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="flex flex-col gap-5">
          {sections.map((section, si) => (
            <motion.div
              key={section.label}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: si * 0.05 }}
            >
              <h2 className="text-[10px] font-display uppercase tracking-[0.2em] text-slate-500 mb-2.5 px-1">
                {section.label}
              </h2>
              <motion.div className="flex flex-col gap-2" variants={staggerContainer} initial="hidden" animate="visible">
                {section.items.map(({ item, info }) => (
                  <InventoryRow
                    key={item.id}
                    item={item}
                    info={info}
                    isUsable={usableItems.has(item.item_config_id)}
                    onTap={handleItemTap}
                  />
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <ItemDetailSheet
            item={selectedItem.item}
            info={selectedItem.info}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ filter }: { filter: string }) {
  const msgs: Record<string, { icon: string; text: string; hint: string }> = {
    all: { icon: '📦', text: 'Инвентарь пуст', hint: 'Исследуй зоны в Галактике, чтобы найти ресурсы и элементы' },
    element: { icon: '🧪', text: 'Нет элементов', hint: 'Отправляй корабли в экспедиции через Галактику' },
    resource: { icon: '📦', text: 'Нет ресурсов', hint: 'Ресурсы можно найти в зонах или получить за экспедиции' },
    artifact: { icon: '✨', text: 'Нет артефактов', hint: 'Создавай артефакты в Лаборатории из элементов' },
  }
  const m = msgs[filter] || msgs.all
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="glass-card p-8 text-center">
      <div className="text-3xl mb-3 opacity-40">{m.icon}</div>
      <p className="text-slate-500 text-xs font-display uppercase tracking-wider mb-1">{m.text}</p>
      <p className="text-[11px] text-slate-600">{m.hint}</p>
    </motion.div>
  )
}

const rarityBorderColors: Record<string, string> = {
  common: '#64748b', uncommon: '#22c55e', rare: '#a855f7', epic: '#f59e0b', legendary: '#ef4444',
}

const InventoryRow = memo(function InventoryRow({
  item, info, isUsable, onTap,
}: {
  item: InventoryItem
  info: ItemInfo
  isUsable: boolean
  onTap: (item: InventoryItem, info: ItemInfo) => void
}) {
  const [imgError, setImgError] = useState(false)
  const rc = rarityConfig[info.rarity] || rarityConfig.common
  const meta = item.metadata || {}
  const hasIcon = info.icon_path && !imgError

  let icon: React.ReactNode
  if (hasIcon) {
    icon = (
      <img
        src={info.icon_path}
        alt={info.name}
        className="w-8 h-8 object-contain"
        onError={() => setImgError(true)}
      />
    )
  } else if (info.resource_type && resourceIcons[info.resource_type]) {
    icon = <span className="text-lg">{resourceIcons[info.resource_type]}</span>
  } else {
    icon = <span className="text-lg">{elementEmoji[item.item_config_id] || '📦'}</span>
  }

  const resourceLabel = info.resource_type === 'fuel'
    ? '⛽ Топливо'
    : info.resource_type === 'repair_kit'
      ? '🔧 Ремонт'
      : null

  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ x: 4, transition: { type: 'spring', stiffness: 300 } }}
      className={`glass-card p-3 flex items-center gap-3 ${rc.border} ${rc.bg} cursor-pointer relative overflow-hidden`}
      style={{
        borderLeft: '3px solid',
        borderLeftColor: rarityBorderColors[info.rarity] || '#64748b',
        boxShadow: `0 0 12px ${rc.glow}`,
      }}
      onClick={() => onTap(item, info)}
    >
      {isUsable && (
        <motion.div
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-neon-green"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{info.name}</p>
          {info.tier >= 1 && (
            <span className={`shrink-0 text-[8px] font-mono px-1.5 py-0.5 rounded border ${tierBadgeCls[info.tier] || tierBadgeCls[1]}`}>
              T{info.tier}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500">
          {resourceLabel || typeLabels[item.item_type] || 'Неизвестный тип'}
          {info.rarity && info.rarity !== 'common' && (
            <span className={`ml-1.5 ${rc.text}`}>{rarityLabel(info.rarity)}</span>
          )}
        </p>
        {item.item_type === 'artifact' && Object.keys(meta).length > 0 && (
          <div className="flex gap-2 mt-1">
            {(meta.speed_mod as number) && <span className="text-[9px] text-neon-cyan/70">⚡ +{(meta.speed_mod as number).toFixed(2)}</span>}
            {(meta.stability_bonus as number) && <span className="text-[9px] text-neon-green/70">🛡️ +{meta.stability_bonus as number}</span>}
            {(meta.fuel_efficiency as number) && <span className="text-[9px] text-neon-amber/70">⛽ +{(meta.fuel_efficiency as number).toFixed(2)}</span>}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <motion.span
          className={`text-base font-display tabular-nums ${rc.text} min-w-[1.5rem] inline-block`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {item.quantity}
        </motion.span>
      </div>
    </motion.div>
  )
})

function rarityLabel(r: string): string {
  const labels: Record<string, string> = {
    uncommon: 'Необычный', rare: 'Редкий', epic: 'Эпический', legendary: 'Легендарный',
  }
  return labels[r] || r
}

function ItemDetailSheet({
  item, info, onClose,
}: {
  item: InventoryItem
  info: ItemInfo
  onClose: () => void
}) {
  const { ships, shipsContent, refuelShip, repairShip, loadInventory, loadShips } = useGameStore()
  const meta = item.metadata || {}
  const rc = rarityConfig[info.rarity] || rarityConfig.common
  const [imgError, setImgError] = useState(false)
  const hasIcon = info.icon_path && !imgError

  const isFuel = item.item_config_id.startsWith('fuel')
  const isRepairKit = item.item_config_id.startsWith('repair_kit')
  const isUsableType = isFuel || isRepairKit

  const matchingShips = useMemo(() => {
    if (!isUsableType) return []
    return ships.filter((s) => {
      const st = parseTier(s.ship_config_id)
      if (s.status !== 'idle') return false
      if (st !== info.tier) return false
      if (isFuel) {
        const cfg = shipsContent.find((c) => c.id === s.ship_config_id)
        const maxFuel = cfg?.stats?.fuel_capacity ?? 50
        if (s.fuel_current >= maxFuel) return false
      }
      if (isRepairKit && s.stability >= 100) return false
      return true
    })
  }, [ships, shipsContent, isUsableType, isFuel, isRepairKit, info.tier])

  const handleUse = useCallback(async () => {
    if (!matchingShips.length) return
    const tg = (window as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void } } } }).Telegram?.WebApp
    tg?.HapticFeedback?.impactOccurred('medium')

    const ship = matchingShips[0]
    try {
      if (isFuel) {
        await refuelShip(ship.id, item.item_config_id)
      } else if (isRepairKit) {
        await repairShip(ship.id, item.item_config_id)
      }
      await Promise.all([loadInventory(), loadShips()])
    } catch {
      // error handled by store
    }
  }, [matchingShips, isFuel, isRepairKit, refuelShip, repairShip, item.item_config_id, loadInventory, loadShips])

  let icon: React.ReactNode
  if (hasIcon) {
    icon = (
      <img
        src={info.icon_path}
        alt={info.name}
        className="w-16 h-16 object-contain"
        onError={() => setImgError(true)}
      />
    )
  } else if (info.resource_type && resourceIcons[info.resource_type]) {
    icon = <span className="text-4xl">{resourceIcons[info.resource_type]}</span>
  } else {
    icon = <span className="text-4xl">{elementEmoji[item.item_config_id] || '📦'}</span>
  }

  const resourceLabel = info.resource_type === 'fuel'
    ? '⛽ Топливо'
    : info.resource_type === 'repair_kit'
      ? '🔧 Ремонт'
      : null

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
        className="relative w-full sm:max-w-md bg-space-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[80vh]"
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

        <div className={`p-6 ${rc.bg}`}>
          <div className="flex items-center gap-4">
            <div className="shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-base uppercase tracking-[0.1em] text-slate-200">{info.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                {info.tier >= 1 && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tierBadgeCls[info.tier] || tierBadgeCls[1]}`}>
                    T{info.tier}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {resourceLabel || typeLabels[item.item_type] || 'Неизвестный тип'}
                </span>
                {info.rarity && info.rarity !== 'common' && (
                  <span className={`text-[10px] ${rc.text}`}>{rarityLabel(info.rarity)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5 pb-24">
          {info.description_key && (
            <div>
              <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Описание</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{info.description_key}</p>
            </div>
          )}

          <div>
            <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Данные</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Количество</span>
                <span className={`font-mono ${rc.text}`}>{item.quantity} ед.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Тип</span>
                <span className="text-slate-300">{resourceLabel || typeLabels[item.item_type] || 'Неизвестный тип'}</span>
              </div>
              {info.tier >= 1 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Уровень</span>
                  <span className="font-mono text-slate-300">T{info.tier}</span>
                </div>
              )}
            </div>
          </div>

          {item.item_type === 'artifact' && Object.keys(meta).length > 0 && (
            <div>
              <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Характеристики</h4>
              <div className="grid grid-cols-2 gap-2">
                {(meta.speed_mod as number) && (
                  <div className="glass-card px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-500">⚡ Скорость</p>
                    <p className="text-sm text-neon-cyan font-mono">+{(meta.speed_mod as number).toFixed(2)}</p>
                  </div>
                )}
                {(meta.stability_bonus as number) && (
                  <div className="glass-card px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-500">🛡️ Стабильность</p>
                    <p className="text-sm text-neon-green font-mono">+{meta.stability_bonus as number}</p>
                  </div>
                )}
                {(meta.fuel_efficiency as number) && (
                  <div className="glass-card px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-500">⛽ Эффективность</p>
                    <p className="text-sm text-neon-amber font-mono">+{(meta.fuel_efficiency as number).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isUsableType && (
            <div>
              <h4 className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">Использование</h4>
              {matchingShips.length > 0 ? (
                <div className="space-y-2">
                  {matchingShips.slice(0, 3).map((ship) => {
                    const shipConfig = shipsContent.find((c) => c.id === ship.ship_config_id)
                    const need = isFuel
                      ? `⛽ ${ship.fuel_current}/${shipConfig?.stats?.fuel_capacity || 0}`
                      : `🛡️ ${ship.stability}%`
                    return (
                      <div key={ship.id} className="glass-card p-3 flex items-center justify-between border border-neon-green/10">
                        <div>
                          <p className="text-xs text-slate-300 font-medium">{shipConfig?.name_key || ship.ship_config_id}</p>
                          <p className="text-[10px] text-slate-500">{need}</p>
                        </div>
                        <button
                          onClick={handleUse}
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-neon-green/15 text-neon-green border border-neon-green/20 hover:bg-neon-green/25 transition"
                        >
                          {isFuel ? '⛽ Заправить' : '🔧 Починить'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-600">Нет подходящих кораблей на базе</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
