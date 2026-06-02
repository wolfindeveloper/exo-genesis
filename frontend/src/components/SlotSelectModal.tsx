import { useEffect, useRef } from 'react'
import type { Artifact, InventoryItem } from '../types'

interface SlotSelectModalProps {
  open: boolean
  slotIndex: number
  equippedArtifact: Artifact | null
  inventory: InventoryItem[]
  artifactsContent: Artifact[]
  onEquip: (artifactId: string) => void
  onUnequip: () => void
  onClose: () => void
}

const TIER_COLORS = ['#94a3b8', '#22c55e', '#a855f7', '#f59e0b', '#ffd700']

export default function SlotSelectModal({
  open,
  slotIndex,
  equippedArtifact,
  inventory,
  artifactsContent,
  onEquip,
  onUnequip,
  onClose,
}: SlotSelectModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const ownedIds = new Set(inventory.filter((i) => i.item_type === 'artifact' && i.quantity > 0).map((i) => i.item_config_id))
  const ownedArtifacts = artifactsContent.filter((a) => ownedIds.has(a.id))

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        ref={ref}
        className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-[12px] border-t border-cyan-500/20 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,245,255,.06)] px-4 pt-4 pb-8 max-h-[70vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-cyan-400/40">
            СЛОТ {slotIndex + 1}
          </h3>
          <button
            onClick={onClose}
            className="text-[8px] text-cyan-400/30 hover:text-cyan-400/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {equippedArtifact && (
          <div className="mb-4 bg-white/5 rounded-xl p-3 border border-cyan-500/10">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${TIER_COLORS[Math.min(equippedArtifact.tier - 1, 4)]}22, transparent)`,
                  border: `1px solid ${TIER_COLORS[Math.min(equippedArtifact.tier - 1, 4)]}44`,
                  boxShadow: `0 0 12px ${TIER_COLORS[Math.min(equippedArtifact.tier - 1, 4)]}22`,
                }}
              >
                ⚙
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-white/80 truncate">{equippedArtifact.name_key}</div>
                <div className="text-[7px] text-cyan-400/20 mt-0.5">ЭКИПИРОВАНО</div>
              </div>
              <button
                onClick={onUnequip}
                className="text-[7px] font-bold tracking-wider text-red-400/50 hover:text-red-400/80 transition-colors px-2 py-1 border border-red-400/10 rounded-md"
              >
                СНЯТЬ
              </button>
            </div>
          </div>
        )}

        <div className="text-[8px] text-cyan-400/20 font-semibold tracking-wider mb-2">
          ДОСТУПНЫЕ АРТЕФАКТЫ
        </div>

        {ownedArtifacts.length === 0 ? (
          <div className="text-[8px] text-cyan-400/10 text-center py-6">
            Нет артефактов в инвентаре
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ownedArtifacts.map((artifact) => {
              const tierColor = TIER_COLORS[Math.min(artifact.tier - 1, 4)]
              const statsText = artifact.stats_modifiers
                ? Object.entries(artifact.stats_modifiers)
                    .map(([k, v]) => `${k}: ${(v > 0 ? '+' : '')}${v}`)
                    .join(' ')
                : ''
              return (
                <button
                  key={artifact.id}
                  onClick={() => onEquip(artifact.id)}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3 border border-cyan-500/10 text-left w-full active:scale-[0.98]"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${tierColor}22, transparent)`,
                      border: `1px solid ${tierColor}44`,
                      boxShadow: `0 0 12px ${tierColor}22`,
                    }}
                  >
                    ⚙
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white/80 truncate">{artifact.name_key}</div>
                    {statsText && (
                      <div className="text-[6px] text-cyan-400/30 mt-0.5 truncate">{statsText}</div>
                    )}
                  </div>
                  <div
                    className="text-[7px] font-bold tracking-wider px-2 py-0.5 rounded"
                    style={{ color: tierColor, border: `1px solid ${tierColor}33` }}
                  >
                    T{artifact.tier}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}