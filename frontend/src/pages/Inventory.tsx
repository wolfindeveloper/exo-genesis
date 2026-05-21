import { useEffect, useState } from 'react'

import { useGameStore } from '../store/game'
import type { InventoryItem } from '../types'

const elementData: Record<string, { name: string; emoji: string; rarity: string }> = {
  elem_hydrogen: { name: 'Водород', emoji: '💧', rarity: 'common' },
  elem_helium: { name: 'Гелий', emoji: '🎈', rarity: 'common' },
  elem_carbon: { name: 'Углерод', emoji: '💎', rarity: 'common' },
  elem_iron: { name: 'Железо', emoji: '⚙️', rarity: 'common' },
  elem_silicon: { name: 'Кремний', emoji: '💻', rarity: 'common' },
  elem_titanium: { name: 'Титан', emoji: '🛡️', rarity: 'uncommon' },
  elem_uranium: { name: 'Уран', emoji: '☢️', rarity: 'uncommon' },
  elem_quantum_crystal: { name: 'Квантовый Кристалл', emoji: '🔮', rarity: 'rare' },
  elem_dark_matter: { name: 'Тёмная Материя', emoji: '🕳️', rarity: 'epic' },
  elem_void_essence: { name: 'Эссенция Пустоты', emoji: '🌀', rarity: 'legendary' },
}

const rarityColors: Record<string, string> = {
  common: 'border-slate-500 text-slate-300',
  uncommon: 'border-green-500 text-green-400',
  rare: 'border-purple-500 text-purple-400',
  epic: 'border-orange-500 text-orange-400',
  legendary: 'border-red-500 text-red-400',
}

const rarityBg: Record<string, string> = {
  common: 'bg-slate-500/20',
  uncommon: 'bg-green-500/20',
  rare: 'bg-purple-500/20',
  epic: 'bg-orange-500/20',
  legendary: 'bg-red-500/20',
}

const typeIcons: Record<string, string> = {
  element: '🧪',
  resource: '📦',
  artifact: '✨',
  consumable: '💊',
}

const typeLabels: Record<string, string> = {
  all: 'Всё',
  element: 'Элементы',
  resource: 'Ресурсы',
  artifact: 'Артефакты',
  consumable: 'Расходники',
}

export function Inventory() {
  const { inventory, loadInventory } = useGameStore()
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { loadInventory() }, [])

  const filtered = filter === 'all' ? inventory : inventory.filter((i) => i.item_type === filter)
  const types = ['all', ...new Set(inventory.map((i) => i.item_type))]

  return (
    <div className="p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Инвентарь</h1>
        <p className="text-sm text-slate-400">{inventory.length} предметов</p>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
              filter === t
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {typeIcons[t] || ''} {typeLabels[t] || t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-800/40 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">Пусто</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <InventoryRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const ed = elementData[item.item_config_id]
  const rarity = ed?.rarity || (item.metadata?.rarity as string) || 'common'
  const meta = item.metadata || {}

  return (
    <div className={`rounded-xl p-3 border ${rarityColors[rarity]} ${rarityBg[rarity]} flex items-center gap-3`}>
      <div className="text-xl">{ed?.emoji || typeIcons[item.item_type] || '📦'}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {ed?.name || item.item_config_id.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-slate-500">{typeLabels[item.item_type] || item.item_type}</p>
        {item.item_type === 'artifact' && Object.keys(meta).length > 0 && (
          <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
            {(meta.speed_mod as number) && <span>⚡ +{(meta.speed_mod as number).toFixed(2)}</span>}
            {(meta.stability_bonus as number) && <span>🛡️ +{meta.stability_bonus as number}</span>}
            {(meta.fuel_efficiency as number) && <span>⛽ +{(meta.fuel_efficiency as number).toFixed(2)}</span>}
          </div>
        )}
      </div>
      <div className="text-right">
        <span className="text-lg font-bold">{item.quantity}</span>
      </div>
    </div>
  )
}
