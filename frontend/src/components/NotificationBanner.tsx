import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { getTelegramWebApp } from '../lib/telegram'
import { useGameStore } from '../store/game'

export function NotificationBanner() {
  const navigate = useNavigate()
  const pendingClaims = useGameStore((s) => s.pendingClaims)
  const removePendingClaim = useGameStore((s) => s.removePendingClaim)
  const [dismissed, setDismissed] = useState(false)
  const shownFresh = useRef(new Set<string>())

  const first = pendingClaims[0]
  const visible = !!first && !dismissed

  // Telegram popup once per fresh claim
  useEffect(() => {
    if (!first) return
    setDismissed(false)
    if (first.fresh && !shownFresh.current.has(first.shipId)) {
      shownFresh.current.add(first.shipId)
      const tg = getTelegramWebApp()
      if (tg?.showPopup) {
        tg.showPopup({
          title: '🚀 Экспедиция завершена!',
          message: `Корабль «${first.shipName}» вернулся из полёта.\nЗабери награду в Ангаре.`,
          buttons: [{ type: 'close' }],
        })
      }
    }
  }, [first?.shipId])

  useEffect(() => {
    if (!first) return
    const t = setTimeout(() => setDismissed(true), 8000)
    return () => clearTimeout(t)
  }, [first?.shipId])

  const handleTap = useCallback(() => {
    if (!first) return
    setDismissed(true)
    removePendingClaim(first.shipId)
    navigate(`/hangar?claim=${first.shipId}`)
  }, [first, navigate, removePendingClaim])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-40 mx-4 mt-2"
        >
          <div className="flex items-center gap-3 bg-gradient-to-r from-neon-green/15 to-neon-cyan/10 backdrop-blur-xl border border-neon-green/20 rounded-xl px-4 py-3">
            <button
              onClick={handleDismiss}
              className="absolute top-1 right-2 text-slate-600 hover:text-slate-400 text-xs leading-none"
            >
              ✕
            </button>
            <span className="text-lg">🚀</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neon-green font-display uppercase tracking-wider">
                {first.shipName} закончил экспедицию!
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Награды ждут — забери их в ангаре
              </p>
            </div>
            <button
              onClick={handleTap}
              className="shrink-0 px-3.5 py-1.5 rounded-lg bg-neon-green/20 text-neon-green text-[10px] font-display uppercase tracking-wider hover:bg-neon-green/30 transition-colors"
            >
              Забрать
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
