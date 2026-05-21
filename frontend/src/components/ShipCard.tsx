import type { Ship } from '../types'

const tierColors = ['', 'border-cyan-400', 'border-green-400', 'border-purple-400', 'border-orange-400', 'border-red-400']
const statusLabels: Record<string, string> = { idle: 'Готов', expedition: 'В полёте', repair: 'Ремонт' }

export function ShipCard({ ship }: { ship: Ship }) {
  const tier = parseInt(ship.ship_config_id.match(/t(\d)/)?.[1] || '1')
  const isIdle = ship.status === 'idle'

  return (
    <div className={`bg-slate-800/60 rounded-xl p-4 border ${tierColors[tier]} backdrop-blur-sm`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{ship.ship_config_id.replace(/_/g, ' ')}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${isIdle ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {statusLabels[ship.status] || ship.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm text-slate-300">
        <div>
          <span className="text-slate-500">Прочность</span>
          <div className="h-1.5 bg-slate-700 rounded-full mt-1">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${ship.stability}%` }} />
          </div>
        </div>
        <div>
          <span className="text-slate-500">Топливо</span>
          <p className="font-mono">{ship.fuel_current}</p>
        </div>
        <div>
          <span className="text-slate-500">Tier</span>
          <p className="text-lg">{'★'.repeat(tier)}</p>
        </div>
      </div>
    </div>
  )
}
