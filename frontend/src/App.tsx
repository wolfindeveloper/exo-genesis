import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'

import { Galaxy } from './pages/Galaxy'
import { Hangar } from './pages/Hangar'
import { Lab } from './pages/Lab'

function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50">
      <div className="flex justify-around py-2">
        <Link to="/hangar" className="flex flex-col items-center gap-0.5 text-xs text-slate-400 hover:text-white transition-colors">
          <span className="text-lg">🚀</span>
          <span>Ангар</span>
        </Link>
        <Link to="/galaxy" className="flex flex-col items-center gap-0.5 text-xs text-slate-400 hover:text-white transition-colors">
          <span className="text-lg">🌌</span>
          <span>Галактика</span>
        </Link>
        <Link to="/lab" className="flex flex-col items-center gap-0.5 text-xs text-slate-400 hover:text-white transition-colors">
          <span className="text-lg">🔬</span>
          <span>Лаб</span>
        </Link>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0e17] text-white max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/hangar" replace />} />
          <Route path="/hangar" element={<Hangar />} />
          <Route path="/galaxy" element={<Galaxy />} />
          <Route path="/lab" element={<Lab />} />
        </Routes>
        <NavBar />
      </div>
    </BrowserRouter>
  )
}
