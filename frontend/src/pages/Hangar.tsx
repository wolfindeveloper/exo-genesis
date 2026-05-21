import { useEffect } from 'react'

import { ShipCard } from '../components/ShipCard'
import { useGameStore } from '../store/game'

export function Hangar() {
  const { ships, loadShips, isLoading } = useGameStore()

  useEffect(() => { loadShips() }, [])

  return (
    <div className="p-4 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Ангар</h1>
        <p className="text-sm text-slate-400">Твой флот</p>
      </header>

      {isLoading && ships.length === 0 ? (
        <p className="text-slate-500">Загрузка...</p>
      ) : ships.length === 0 ? (
        <div className="bg-slate-800/40 rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-2">Нет кораблей</p>
          <p className="text-xs text-slate-500">Купи первый корабль, чтобы начать исследования</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ships.map((ship) => (
            <ShipCard key={ship.id} ship={ship} />
          ))}
        </div>
      )}
    </div>
  )
}
