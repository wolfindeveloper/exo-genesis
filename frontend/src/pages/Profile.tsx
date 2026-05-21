import { useEffect } from 'react'

import { useGameStore } from '../store/game'

export function Profile() {
  const { user, stats, loadProfile, loadStats } = useGameStore()

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [])

  if (!user) return <div className="p-4 text-slate-500">Загрузка...</div>

  const level = user.level || 1
  const xp = user.xp || 0
  const nextLevelXp = level * 100
  const xpPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100))

  return (
    <div className="p-4 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Профиль</h1>
        <p className="text-sm text-slate-400">{user.username || 'Без имени'}</p>
      </header>

      {/* Level & XP */}
      <div className="bg-slate-800/60 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">Уровень {level}</span>
          <span className="text-xs text-slate-500">{xp} / {nextLevelXp} XP</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
        </div>
        <div className="flex justify-between mt-3 text-sm">
          <div>
            <p className="text-slate-400">🔥 Стреак</p>
            <p className="font-bold">{user.streak_days || 0} дней</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">⭐ Stars</p>
            <p className="font-bold">{user.balance_stars || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">🔷 XGEN</p>
            <p className="font-bold">{user.balance_xgen || 0}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Статистика</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Экспедиций" value={stats?.total_expeditions ?? '-'} icon="🚀" />
        <StatCard label="Завершено" value={stats?.completed_expeditions ?? '-'} icon="✅" />
        <StatCard label="Провалено" value={stats?.failed_expeditions ?? '-'} icon="💥" />
        <StatCard label="Артефактов" value={stats?.artifacts_crafted ?? '-'} icon="✨" />
        <StatCard label="Открытий" value={stats?.discoveries_made ?? '-'} icon="🏆" />
        <StatCard label="Элементов" value={stats?.total_elements ?? '-'} icon="🧪" />
        <div className="col-span-2 bg-slate-800/40 rounded-xl p-3 text-sm">
          <span className="text-slate-400">В проекте</span>{' '}
          <span className="font-bold">{stats?.joined_days ?? 0} дней</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{icon} {label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}
