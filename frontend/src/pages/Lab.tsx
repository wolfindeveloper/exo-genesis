import { useEffect, useState } from 'react'

import { useGameStore } from '../store/game'
import type { InventoryItem } from '../types'

const rarityColors: Record<string, string> = {
  common: 'border-slate-500 text-slate-300',
  uncommon: 'border-green-500 text-green-400',
  rare: 'border-purple-500 text-purple-400',
  epic: 'border-orange-500 text-orange-400',
  legendary: 'border-red-500 text-red-400',
}

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

const rarityLabels: Record<string, string> = {
  common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий',
  epic: 'Эпический', legendary: 'Легендарный',
}

export function Lab() {
  const { inventory, loadInventory, experiment, lastExperiment, isLoading } = useGameStore()
  const [slots, setSlots] = useState<(InventoryItem | null)[]>([null, null, null])
  const [nextSlot, setNextSlot] = useState(0)

  useEffect(() => { loadInventory() }, [])

  const elements = inventory.filter((i) => i.item_type === 'element' && i.quantity > 0)

  const handleSelectElement = (item: InventoryItem) => {
    if (nextSlot >= 3) return
    const newSlots = [...slots]
    newSlots[nextSlot] = item
    setSlots(newSlots)
    setNextSlot(nextSlot + 1)
  }

  const handleRemoveSlot = (index: number) => {
    const newSlots = [...slots]
    newSlots[index] = null
    setSlots(newSlots)
    const filled = newSlots.filter(Boolean).length
    setNextSlot(filled)
  }

  const handleCraft = async () => {
    const filled = slots.filter(Boolean)
    if (filled.length < 2) return
    await experiment(filled.map((s) => s!.item_config_id))
  }

  const filledCount = slots.filter(Boolean).length

  return (
    <div className="p-4 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Лаборатория</h1>
        <p className="text-sm text-slate-400">Комбинируй элементы для крафта артефактов</p>
      </header>

      {/* Слоты крафта */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {slots.map((slot, i) => (
          <div
            key={i}
            onClick={() => slot && handleRemoveSlot(i)}
            className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-center p-2 cursor-pointer transition-colors ${
              slot
                ? `${rarityColors[elementData[slot.item_config_id]?.rarity] || 'border-slate-500'} border-solid bg-slate-800/80`
                : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
            }`}
          >
            {slot ? (
              <div>
                <div className="text-lg mb-1">{elementData[slot.item_config_id]?.emoji || '?'}</div>
                <div className="text-[10px] leading-tight">{elementData[slot.item_config_id]?.name || slot.item_config_id}</div>
              </div>
            ) : (
              <span className="text-slate-600 text-xs">{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Кнопка крафта */}
      <button
        onClick={handleCraft}
        disabled={filledCount < 2 || isLoading}
        className="w-full py-3 rounded-xl font-bold text-sm mb-6 transition disabled:opacity-40 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
      >
        {isLoading ? 'Крафт...' : `Крафт (${filledCount}/3)`}
      </button>

      {/* Результат */}
      {lastExperiment && (
        <div className={`rounded-xl p-4 mb-6 border ${lastExperiment.success ? 'bg-green-900/20 border-green-500/40' : 'bg-red-900/20 border-red-500/40'}`}>
          {lastExperiment.success ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✨</span>
                <h3 className="font-bold">Артефакт создан!</h3>
              </div>
              <p className="text-sm text-slate-300 mb-1">
                {lastExperiment.artifact_name_key?.replace(/_/g, ' ') || 'Неизвестный артефакт'}
              </p>
              <p className="text-xs text-slate-400">
                Tier {lastExperiment.artifact_tier} · {rarityLabels[lastExperiment.artifact_rarity || ''] || lastExperiment.artifact_rarity}
              </p>
              {lastExperiment.is_first_discoverer && (
                <p className="text-xs text-yellow-400 mt-1">🏆 Первооткрыватель!</p>
              )}
              <p className="text-xs text-green-400 mt-1">+{lastExperiment.xp_gained} XP</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💥</span>
                <h3 className="font-bold">Неудача</h3>
              </div>
              <p className="text-sm text-slate-400">Комбинация не сработала</p>
              <p className="text-xs text-green-400 mt-1">+{lastExperiment.xp_gained} XP</p>
            </div>
          )}
        </div>
      )}

      {/* Инвентарь элементов */}
      <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Доступные элементы</h2>
      {elements.length === 0 ? (
        <p className="text-slate-500 text-sm">Нет элементов. Исследуй зоны в Галактике!</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {elements.map((item) => {
            const ed = elementData[item.item_config_id]
            const rarity = ed?.rarity || 'common'
            const isSelected = slots.some((s) => s?.item_config_id === item.item_config_id)
            return (
              <button
                key={item.id}
                onClick={() => handleSelectElement(item)}
                disabled={isSelected || nextSlot >= 3}
                className={`px-3 py-2 rounded-xl text-sm border transition ${
                  rarityColors[rarity]
                } ${
                  isSelected ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700/50 cursor-pointer'
                } bg-slate-800/60`}
              >
                <span className="mr-1">{ed?.emoji || '?'}</span>
                {ed?.name || item.item_config_id}
                <span className="ml-1 text-slate-500">x{item.quantity}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
