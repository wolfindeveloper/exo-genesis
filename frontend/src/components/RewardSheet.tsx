import { useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { useGameStore } from '../store/game'
import type { LootItem } from '../types'

function lootLabel(item: LootItem): string {
  const { resourcesContent, artifactsContent } = useGameStore.getState()
  const res = resourcesContent.find((r) => r.id === item.item_config_id)
  if (res) return res.name_key
  const art = artifactsContent.find((a) => a.id === item.item_config_id)
  if (art) return art.name_key
  return 'Неизвестный предмет'
}

function lootIcon(item: LootItem): string {
  const { resourcesContent } = useGameStore.getState()
  const res = resourcesContent.find((r) => r.id === item.item_config_id)
  if (res?.icon_path) return res.icon_path
  return ''
}

export function RewardSheet() {
  const lastLoot = useGameStore((s) => s.lastLoot)
  const clearLastLoot = useGameStore((s) => s.clearLastLoot)

  const handleClose = useCallback(() => clearLastLoot(), [clearLastLoot])

  const open = !!lastLoot

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-[95] bg-space-900 border border-white/10 rounded-t-2xl shadow-2xl max-w-lg mx-auto"
          >
            <div className="p-5 pb-8 space-y-4">
              {/* Handle */}
              <div className="flex justify-center -mt-2 mb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
                  className="text-4xl mb-2"
                >
                  🎉
                </motion.div>
                <h2 className="font-display text-base text-neon-green uppercase tracking-widest">
                  Экспедиция завершена!
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lastLoot?.shipName} вернулся с добычей
                </p>
              </div>

              {/* Loot list */}
              {lastLoot && lastLoot.loot.length > 0 && (
                <div className="glass-card p-3 space-y-2">
                  <p className="text-[10px] font-display uppercase tracking-wider text-slate-500 mb-2">
                    Добыча
                  </p>
                  {lastLoot.loot.map((item, i) => {
                    const icon = lootIcon(item)
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex items-center justify-between bg-space-600/50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2.5">
                          {icon ? (
                            <img src={icon} alt="" className="w-5 h-5 object-contain" />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                          <span className="text-sm text-slate-200">{lootLabel(item)}</span>
                        </div>
                        <span className="font-display text-neon-cyan text-xs">x{item.quantity}</span>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Stability */}
              {lastLoot && (
                <div className="flex items-center justify-between text-xs bg-space-600/30 rounded-lg px-3 py-2">
                  <span className="text-slate-500">⚡ Прочность корабля</span>
                  <span className="font-mono text-slate-300">{lastLoot.shipStability}%</span>
                </div>
              )}

              {/* Confirm */}
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-green/80 to-neon-cyan/80 hover:from-neon-green hover:to-neon-cyan font-display text-sm uppercase tracking-wider transition"
              >
                Отлично!
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
