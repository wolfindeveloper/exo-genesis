import { useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, Globe2, Package, Rocket, Settings, ShoppingBag, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useNotifications } from '../hooks/useNotifications'
import { useTranslate } from '../hooks/useTranslate'
import { useSettingsStore } from '../store/settings'

const nav = [
  { path: '/', icon: Rocket, key: 'nav.hangar' },
  { path: '/guide', icon: BookOpen, key: 'nav.guide' },
  { path: '/galaxy', icon: Globe2, key: 'nav.map' },
  { path: '/inventory', icon: Package, key: 'nav.inv' },
  { path: '/profile', icon: User, key: 'nav.profile' },
  { path: '/shop', icon: ShoppingBag, key: 'nav.shop' },
]

function BadgeDot({ color }: { color: string }) {
  return (
    <motion.span
      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
      style={{
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`,
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      <span
        className="absolute inset-0 rounded-full animate-ping"
        style={{ backgroundColor: color, opacity: 0.5 }}
      />
    </motion.span>
  )
}

function NavIcon({ icon: Icon, active }: { icon: typeof Rocket; active: boolean }) {
  return (
    <span className="relative">
      <Icon
        size={20}
        strokeWidth={1.5}
        className={`transition-all ${active ? 'text-neon-cyan drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]' : 'text-slate-600'}`}
      />
    </span>
  )
}

export function NavBar() {
  const location = useLocation()
  const isCockpit = location.pathname === '/'
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)
  const t = useTranslate()
  const { hasCompletedExpedition, hasUnlockedGuideEntry, hasUnclaimedReward } = useNotifications()

  const handleSettings = useCallback(() => setSettingsOpen(true), [setSettingsOpen])

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 safe-area-pb backdrop-blur-[16px] border-t transition-all duration-300 ${
        isCockpit
          ? 'bg-white/[0.03] border-cyan-500/[0.07]'
          : 'bg-space-900/80 border-white/[0.04]'
      }`}
    >
      <div className="flex max-w-lg mx-auto items-stretch">
        {nav.map((item) => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 relative transition-all ${
                active ? 'text-neon-cyan' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-bg"
                  className="absolute inset-x-2 inset-y-1 rounded-xl bg-white/[0.06] border border-white/[0.06]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <motion.span
                  layoutId="nav-active-bar"
                  className="absolute -top-px left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-neon-cyan/60 via-neon-cyan to-neon-cyan/60"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <span className="font-display text-[11px] uppercase tracking-wider relative">
                  {t(item.key)}
                </span>
              )}
              <span className="relative">
                <NavIcon icon={item.icon} active={active} />
                <AnimatePresence>
                  {item.path === '/' && hasCompletedExpedition && (
                    <BadgeDot color="#22c55e" />
                  )}
                  {item.path === '/guide' && hasUnlockedGuideEntry && (
                    <BadgeDot color="#a855f7" />
                  )}
                  {item.path === '/guide' && !hasUnlockedGuideEntry && hasUnclaimedReward && (
                    <BadgeDot color="#f59e0b" />
                  )}
                </AnimatePresence>
              </span>
            </Link>
          )
        })}
        <button
          onClick={handleSettings}
          className="flex items-center justify-center px-3 py-3 transition-colors text-slate-600 hover:text-slate-400 relative"
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  )
}
