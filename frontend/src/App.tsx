import { AnimatePresence } from 'motion/react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'

import { Galaxy } from './pages/Galaxy'
import { Hangar } from './pages/Hangar'
import { Inventory } from './pages/Inventory'
import { Lab } from './pages/Lab'
import { Profile } from './pages/Profile'
import { PageTransition } from './components/PageTransition'

function NavBar() {
  const linkClass = (path: string) =>
    `flex flex-col items-center gap-0.5 text-xs transition-colors ${
      location.pathname === path ? 'text-neon-cyan' : 'text-slate-500 hover:text-slate-300'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-space-800/80 backdrop-blur-xl border-t border-white/5">
      <div className="flex justify-around py-2 max-w-lg mx-auto">
        <Link to="/hangar" className={linkClass('/hangar')}>
          <span className="text-lg">🚀</span>
          <span>Ангар</span>
        </Link>
        <Link to="/galaxy" className={linkClass('/galaxy')}>
          <span className="text-lg">🌌</span>
          <span>Галактика</span>
        </Link>
        <Link to="/lab" className={linkClass('/lab')}>
          <span className="text-lg">🔬</span>
          <span>Лаб</span>
        </Link>
        <Link to="/inventory" className={linkClass('/inventory')}>
          <span className="text-lg">🎒</span>
          <span>Инв</span>
        </Link>
        <Link to="/profile" className={linkClass('/profile')}>
          <span className="text-lg">👤</span>
          <span>Проф</span>
        </Link>
      </div>
    </nav>
  )
}

function AppContent() {
  const location = useLocation()

  return (
    <div className="min-h-screen text-white max-w-lg mx-auto relative z-10">
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
      <NavBar />
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
