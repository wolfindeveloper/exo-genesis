import { useMemo } from 'react'

interface HexSlotProps {
  active: boolean
  icon: string
  name?: string
  tier?: number
  onClick?: () => void
  side?: 'left' | 'right'
  flicker?: boolean
}

const TIER_COLORS = ['#94a3b8', '#22c55e', '#a855f7', '#f59e0b', '#ffd700']

export function HexSlot({ active, icon, name, tier = 1, onClick, side, flicker }: HexSlotProps) {
  const color = active ? TIER_COLORS[Math.min(tier - 1, 4)] : '#4a5568'

  const dust = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        left: 10 + (i * 17 + 3) % 80,
        top: 8 + (i * 13 + 7) % 84,
        size: 1 + (i % 3),
        delay: i * 0.9,
        duration: 3 + (i % 3) * 1.2,
      })),
    [],
  )

  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* outer glow layers */}
      {active && (
        <>
          <div
            className="absolute -inset-4 rounded-full blur-3xl transition-all duration-700 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${color}55, transparent 70%)`, animation: 'slot-glow-pulse 4s ease-in-out infinite' }}
          />
          <div
            className="absolute -inset-2 rounded-full blur-xl transition-all duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${color}44, transparent 60%)` }}
          />
        </>
      )}

      {/* slot circle */}
      <div
        className={`w-14 h-14 relative rounded-full transition-all duration-300 overflow-hidden ${
          active ? 'border-[2.5px]' : 'border border-dashed border-gray-700/20 bg-gray-900/40'
        } ${flicker ? 'animate-slot-flicker' : ''}`}
        style={{
          borderColor: active ? color : undefined,
          background: active
            ? `radial-gradient(ellipse at 35% 30%, ${color}33, transparent 70%), radial-gradient(ellipse at 70% 80%, ${color}22, transparent 50%), #0f1420`
            : undefined,
          boxShadow: active ? `0 0 25px ${color}44, inset 0 0 30px ${color}11` : undefined,
        }}
      >
        {/* nebulous inner glow */}
        {active && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle at 40% 35%, ${color}44, transparent 60%)` }}
          />
        )}

        {/* space dust particles */}
        {active && dust.map((d, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-dust-float pointer-events-none"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: `${d.size + 1}px`,
              height: `${d.size + 1}px`,
              background: color,
              boxShadow: `0 0 4px ${color}`,
              opacity: 0.2 + (i % 3) * 0.15,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
              ['--dust-dur' as string]: `${d.duration}s`,
            }}
          />
        ))}

        {/* icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span
            className="text-[16px] leading-none"
            style={active ? { filter: `drop-shadow(0 0 8px ${color})` } : { opacity: 0.3 }}
          >
            {icon}
          </span>
        </div>
      </div>

      {/* name label */}
      {name && (
        <span
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[6px] text-center whitespace-nowrap font-semibold tracking-wider"
          style={{ color: `${color}99` }}
        >
          {name}
        </span>
      )}

      {/* active dot indicator */}
      {active && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
            side === 'right' ? '-left-2' : '-right-2'
          }`}
          style={{
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      )}
    </div>
  )
}
