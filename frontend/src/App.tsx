import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'

import { BoxReveal } from './components/BoxReveal'
import { Galaxy } from './pages/Galaxy'
import { HudBar } from './components/HudBar'
import { NavBar } from './components/NavBar'
import { RewardSheet } from './components/RewardSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { useGameStore } from './store/game'
import { useSettingsStore } from './store/settings'
import { initAudio, playMusic, stopMusic } from './lib/audio'
import ShipPage from './pages/ShipPage'
import GuidePage from './pages/GuidePage'
import { Inventory } from './pages/Inventory'
import { Profile } from './pages/Profile'
import { Shop } from './pages/Shop'
import { PageTransition } from './components/PageTransition'

function AppContent() {
  const location = useLocation()
  const loadContent = useGameStore((s) => s.loadContent)
  const initAuth = useGameStore((s) => s.initAuth)
  const musicEnabled = useSettingsStore((s) => s.musicEnabled)
  const isCockpit = location.pathname === '/'
  const isAuthReady = useGameStore((s) => s.isAuthReady)
  const isContentReady = useGameStore((s) => s.isContentReady)
  const error = useGameStore((s) => s.error)
  const initFailed = useGameStore((s) => s.initFailed)

  useEffect(() => {
    initAuth()
    loadContent()
  }, [])

  useEffect(() => {
    initAudio()
  }, [])

  useEffect(() => {
    if (musicEnabled) playMusic()
    else stopMusic()
  }, [musicEnabled])

  if (!isAuthReady || !isContentReady) {
    return (
      <div className="min-h-screen text-white max-w-lg mx-auto relative z-10 pb-16">
        <div className="flex flex-col items-center justify-center h-screen gap-4 px-6">
          <motion.div
            className="text-5xl"
            animate={initFailed ? { opacity: 0.3 } : { rotate: 360 }}
            transition={initFailed ? {} : { duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            {initFailed ? '🌑' : '🚀'}
          </motion.div>
          {initFailed ? (
            <>
              <p className="text-slate-400 text-xs font-display uppercase tracking-widest text-center">
                Не удалось подключиться к серверу
              </p>
              <p className="text-slate-600 text-[10px] text-center max-w-xs">
                {error || 'Проверьте соединение и попробуйте снова'}
              </p>
              <button
                onClick={() => {
                  useGameStore.getState().initAuth()
                  useGameStore.getState().loadContent()
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-neon-cyan/10 text-neon-cyan text-xs font-display uppercase tracking-wider border border-neon-cyan/20 active:bg-neon-cyan/20 transition-colors"
              >
                Повторить
              </button>
            </>
          ) : (
            <p className="text-slate-500 text-xs font-display uppercase tracking-widest">
              Загрузка галактики...
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white max-w-lg mx-auto relative z-10 pb-16">
      {!isCockpit && <HudBar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><ShipPage /></PageTransition>} />
          <Route path="/guide" element={<PageTransition><GuidePage /></PageTransition>} />
          <Route path="/galaxy" element={<PageTransition><Galaxy /></PageTransition>} />
          <Route path="/inventory" element={<PageTransition><Inventory /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {error && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-red-900/90 backdrop-blur-xl p-3 text-center text-xs text-red-200 font-mono">
          Error: {error}
        </div>
      )}
      <NavBar />
      <BoxReveal />
      <RewardSheet />
      <SettingsSheet />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="starfield" />
      <AppContent />
    </BrowserRouter>
  )
}
