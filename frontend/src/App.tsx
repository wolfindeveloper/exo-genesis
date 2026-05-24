import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'

import { BoxReveal } from './components/BoxReveal'
import { Galaxy } from './pages/Galaxy'
import { HudBar } from './components/HudBar'
import { useGameStore } from './store/game'
import { Hangar } from './pages/Hangar'
import { Inventory } from './pages/Inventory'
import { Lab } from './pages/Lab'
import { Profile } from './pages/Profile'
import { PageTransition } from './components/PageTransition'

const nav = [
  { path: '/hangar', icon: '🚀', label: 'Ангар' },
  { path: '/galaxy', icon: '🌌', label: 'Карта' },
  { path: '/lab', icon: '🔬', label: 'Лаб' },
  { path: '/inventory', icon: '🎒', label: 'Инв' },
  { path: '/profile', icon: '👤', label: 'Проф' },
]

function NavBar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-space-800/90 backdrop-blur-xl border-t border-white/5 safe-area-pb">
      <div className="flex max-w-lg mx-auto">
        {nav.map((item) => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-all relative ${
                active ? 'text-neon-cyan' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {active && (
                <span className="absolute -top-px left-1/4 right-1/4 h-0.5 bg-neon-cyan rounded-full" />
              )}
              <span className={`${active ? 'scale-110' : ''} transition-transform text-base`}>{item.icon}</span>
              <span className="font-display uppercase tracking-wider">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function AppContent() {
  const location = useLocation()
  const loadContent = useGameStore((s) => s.loadContent)
  const initAuth = useGameStore((s) => s.initAuth)
  const isAuthReady = useGameStore((s) => s.isAuthReady)
  const isContentReady = useGameStore((s) => s.isContentReady)
  const error = useGameStore((s) => s.error)

  useEffect(() => {
    initAuth()
    loadContent()
  }, [])

  if (!isAuthReady || !isContentReady) {
    return (
      <div className="min-h-screen text-white max-w-lg mx-auto relative z-10 pb-16">
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <motion.div
            className="text-5xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            🚀
          </motion.div>
          <p className="text-slate-500 text-xs font-display uppercase tracking-widest">
            Загрузка галактики...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white max-w-lg mx-auto relative z-10 pb-16">
      <HudBar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Hangar /></PageTransition>} />
          <Route path="/hangar" element={<PageTransition><Hangar /></PageTransition>} />
          <Route path="/galaxy" element={<PageTransition><Galaxy /></PageTransition>} />
          <Route path="/lab" element={<PageTransition><Lab /></PageTransition>} />
          <Route path="/inventory" element={<PageTransition><Inventory /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {error && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-red-900/90 backdrop-blur-xl p-3 text-center text-xs text-red-200 font-mono">
          Error: {error}
        </div>
      )}
      <NavBar />
      <BoxReveal />
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
