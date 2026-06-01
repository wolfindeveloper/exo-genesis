import { type MouseEventHandler } from 'react'

interface HexSlotProps {
  active: boolean
  icon: string
  name?: string
  glow: string
  onClick?: MouseEventHandler<HTMLDivElement>
  side?: 'left' | 'right'
}

export function HexSlot({ active, icon, name, glow, onClick, side }: HexSlotProps) {
  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      <div
        className={`absolute inset-0 clip-hexagon blur-sm transition-opacity duration-500 ${
          active ? 'opacity-60' : 'opacity-10'
        }`}
        style={{
          background: active
            ? `radial-gradient(ellipse at center, ${glow}40, transparent)`
            : '#000',
        }}
      />
      <div
        className={`w-9 h-10 relative clip-hexagon transition-all duration-300 ${
          active
            ? 'bg-gradient-to-b from-cyan-500/15 via-cyan-500/8 to-gray-900/80 border-cyan-400/40 shadow-[0_0_15px_#00f5ff]'
            : 'bg-gray-900/60 border-gray-700/20'
        } border`}
      >
        {active && (
          <div className="absolute inset-0 clip-hexagon bg-gradient-to-b from-cyan-400/10 to-transparent" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[9px] leading-none ${active ? 'drop-shadow-[0_0_6px_#00f5ff]' : 'opacity-30'}`}>
            {icon}
          </span>
          {name && (
            <span className="text-[5px] text-cyan-300/60 mt-0.5 leading-none truncate max-w-[24px]">
              {name}
            </span>
          )}
        </div>
      </div>
      {active && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,245,255,.8)] ${
            side === 'right' ? '-left-1.5' : '-right-1.5'
          }`}
        />
      )}
    </div>
  )
}
