import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { useGameStore } from '../store/game'
import { HexSlot } from '../components/HexSlot'
import SlotSelectModal from '../components/SlotSelectModal'
import { useExpeditionTimer } from '../hooks/useTimer'
import { getXpProgress } from '../lib/xp'
import { getAvatarUrl, getFirstName } from '../lib/telegram'
import type { Artifact } from '../types'
import { api } from '../api/client'

const RED_BUTTON_LS = 'eggs/red_button'

const consoleButtons = [
  { label: 'ГДЕ-ТО ТАМ', accent: '#00f5ff', path: '/galaxy', msg: 'Вы все равно заблудитесь' },
  { label: 'КОЛЛЕКЦИЯ ХЛАМА', accent: '#a855f7', path: '/inventory' },
  { label: 'НЕ ПАНИКУЙТЕ', accent: '#00f5ff' },
  { label: 'СПЕКУЛЯТИВНАЯ ЛАВКА', accent: '#f97316', sub: 'Цены высоки, надежды низки' },
]

/* ── Easter egg sticker schedule ── */
const EGGS_LS = 'eggs/sticker'
const SPAWN_MIN_MS = 2 * 60 * 60 * 1000
const SPAWN_MAX_MS = 6 * 60 * 60 * 1000
const WINDOW_MS = 15 * 60 * 1000

function scheduleNextSpawn(): void {
  const delay = SPAWN_MIN_MS + Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS)
  const next = Date.now() + delay
  localStorage.setItem(`${EGGS_LS}/next_spawn`, String(next))
  localStorage.setItem(`${EGGS_LS}/expires_at`, String(next + WINDOW_MS))
  localStorage.removeItem(`${EGGS_LS}/state`)
}

function initSpawnSchedule(): void {
  const stored = localStorage.getItem(`${EGGS_LS}/next_spawn`)
  if (!stored || Date.now() >= +stored + WINDOW_MS + 60_000) {
    scheduleNextSpawn()
  }
}

function isStickerActive(): boolean {
  const next = localStorage.getItem(`${EGGS_LS}/next_spawn`)
  const expires = localStorage.getItem(`${EGGS_LS}/expires_at`)
  if (!next || !expires) return false
  const now = Date.now()
  return now >= +next && now < +expires
}

function clearSpawnSchedule(): void {
  localStorage.removeItem(`${EGGS_LS}/next_spawn`)
  localStorage.removeItem(`${EGGS_LS}/expires_at`)
  localStorage.removeItem(`${EGGS_LS}/state`)
}

export default function ShipPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const user = useGameStore((s) => s.user)
  const setUser = useGameStore((s) => s.setUser)
  const ships = useGameStore((s) => s.ships)
  const shipsContent = useGameStore((s) => s.shipsContent)
  const artifactsContent = useGameStore((s) => s.artifactsContent)
  const inventory = useGameStore((s) => s.inventory)
  const equipSlot = useGameStore((s) => s.equipSlot)
  const unequipSlot = useGameStore((s) => s.unequipSlot)
  const loadShips = useGameStore((s) => s.loadShips)
  const loadInventory = useGameStore((s) => s.loadInventory)
  const refuelShip = useGameStore((s) => s.refuelShip)
  const repairShip = useGameStore((s) => s.repairShip)
  const zonesContent = useGameStore((s) => s.zonesContent)
  const activeExpeditions = useGameStore((s) => s.activeExpeditions)
  const loadActiveExpeditions = useGameStore((s) => s.loadActiveExpeditions)
  const claimExpedition = useGameStore((s) => s.claimExpedition)
  const isLoading = useGameStore((s) => s.isLoading)

  useEffect(() => { loadShips(); loadInventory(); loadActiveExpeditions() }, [])

  const level = user?.level ?? 1
  const xp = user?.xp ?? 0
  const xpPct = getXpProgress(xp, level)
  const navigate = useNavigate()

  const avatarUrl = getAvatarUrl()
  const first = getFirstName()

  const [stickerIdx, setStickerIdx] = useState(() => {
    const saved = localStorage.getItem(`${EGGS_LS}/state`)
    return saved ? +saved : 0
  })
  const [stickerVisible, setStickerVisible] = useState(false)
  const [consoleMsg, setConsoleMsg] = useState<string | null>(null)
  const [fuelLabel, setFuelLabel] = useState<string | null>(null)
  const [muteCount, setMuteCount] = useState(0)
  const [stareTimer, setStareTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [redClicks, setRedClicks] = useState(() => {
    const saved = localStorage.getItem(RED_BUTTON_LS)
    return saved ? +saved : 0
  })

  /* ── Easter egg spawn checker ── */
  useEffect(() => {
    initSpawnSchedule()
    const check = () => setStickerVisible(isStickerActive())
    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [])

  /* reset sticker clicks on new spawn */
  useEffect(() => {
    if (!stickerVisible) return
    const saved = localStorage.getItem(`${EGGS_LS}/state`)
    if (!saved) setStickerIdx(0)
  }, [stickerVisible])

  useEffect(() => {
    if (!consoleMsg) return
    const t = setTimeout(() => setConsoleMsg(null), 2500)
    return () => clearTimeout(t)
  }, [consoleMsg])

  useEffect(() => {
    if (!fuelLabel) return
    const t = setTimeout(() => setFuelLabel(null), 2000)
    return () => clearTimeout(t)
  }, [fuelLabel])

  /* ── Idle timer for stare_60s event ── */
  useEffect(() => {
    function resetIdle() {
      if (stareTimer) clearTimeout(stareTimer)
      const t = setTimeout(() => {
        api.logEvent('stare_60s').catch(() => {})
      }, 60_000)
      setStareTimer(t)
    }
    const events = ['mousedown', 'mousemove', 'touchstart', 'keydown', 'scroll']
    events.forEach((e) => window.addEventListener(e, resetIdle))
    resetIdle()
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle))
      if (stareTimer) clearTimeout(stareTimer)
    }
  }, [])

  const stickerMessages = [
    'НЕ НАЖИМАТЬ',
    'ЗАЧЕМ ТЫ ЭТО СДЕЛАЛ?',
    'ХВАТИТ',
    '...',
    'ТЫ ЧТО, ГЛУХОЙ?',
    '⚠️',
    'СЕРЬЁЗНО?',
    'ТВОЁ УПОРСТВО ВОСХИЩАЕТ',
    'ЛАДНО, ВОТ ТЕБЕ 1 XGEN, ТОЛЬКО ОТСТАНЬ',
  ]
  const STICKER_FINAL = stickerMessages.length - 1

  const mainShip = ships.length > 0 ? ships[0] : null
  /* ── fuel_below_5 event check ── */
  useEffect(() => {
    if (mainShip && mainShip.fuel_current <= 5 && mainShip.fuel_current > 0) {
      api.logEvent('fuel_below_5').catch(() => {})
    }
  }, [mainShip?.fuel_current])
  const shipConfig = mainShip ? shipsContent.find((c) => c.id === mainShip.ship_config_id) : null
  const shipName = shipConfig?.name_key ?? 'VEGA MK-II'

  const slotArtifacts: (Artifact | null)[] = Array.from({ length: 8 }, (_, i) => {
    const id = (mainShip?.equipped_artifacts ?? [])[i]
    return id ? (artifactsContent.find((a) => a.id === id) ?? null) : null
  })

  /* ── Inventory counts ── */
  const fuelInInventory = inventory
    .filter((i) => i.item_config_id === 'fuel' || i.item_config_id.startsWith('fuel_t'))
    .reduce((sum, i) => sum + i.quantity, 0)
  const repairInInventory = inventory
    .filter((i) => i.item_config_id === 'repair_kit' || i.item_config_id.startsWith('repair_kit_t'))
    .reduce((sum, i) => sum + i.quantity, 0)

  const isShipIdle = mainShip?.status === 'idle'

  const handleRefuel = async () => {
    if (!mainShip || fuelInInventory === 0) return
    await refuelShip(mainShip.id, 'fuel')
  }

  const handleRepair = async () => {
    if (!mainShip || repairInInventory === 0) return
    await repairShip(mainShip.id, 'repair_kit')
  }

  /* ── Expedition state ── */
  const activeExp = activeExpeditions[0] ?? null
  const activeZoneName = activeExp
    ? (zonesContent.find((z) => z.id === activeExp.zone_config_id)?.name_key ?? activeExp.zone_config_id)
    : null
  const expTimer = useExpeditionTimer(activeExp?.start_time ?? null, activeExp?.end_time ?? null)

  const handleClaimExpedition = async () => {
    if (!activeExp) return
    await claimExpedition(activeExp.id, shipName)
    await loadActiveExpeditions()
  }

  const [slotModalIndex, setSlotModalIndex] = useState<number | null>(null)
  const closeModal = useCallback(() => setSlotModalIndex(null), [setSlotModalIndex])

  function handleSlotClick(i: number) {
    setSlotModalIndex(i)
  }

  const SLOT_LABELS: { icon: string; name: string }[] = [
    { icon: '🥜', name: 'Ядро' },
    { icon: '🧻', name: '' },
    { icon: '💨', name: 'Факел' },
    { icon: '👁️', name: 'Око' },
    { icon: '🛒', name: '' },
    { icon: '🥩', name: 'Сердце' },
    { icon: '🎞️', name: 'Память' },
    { icon: '🕳️', name: '' },
  ]

  /* ── canvas stars + particles ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let stars: { x: number; y: number; r: number; a: number; speed: number; phase: number }[] = []
    let particles: { x: number; y: number; vx: number; vy: number; r: number; life: number; maxLife: number }[] = []

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: 0.3 + Math.random() * 1.2,
        a: 0.2 + Math.random() * 0.6,
        speed: 0.2 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    let pt = 0
    function draw(t: number) {
      const w = canvas!.width
      const h = canvas!.height
      ctx!.clearRect(0, 0, w, h)

      for (const s of stars) {
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase))
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(180,230,255,${s.a * tw})`
        ctx!.fill()
      }

      pt++
      if (pt > 8 && particles.length < 15) {
        pt = 0
        particles.push({
          x: Math.random() * w,
          y: h + 5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.2 - Math.random() * 0.4,
          r: 0.5 + Math.random() * 1.5,
          life: 0,
          maxLife: 300 + Math.random() * 400,
        })
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life++
        const alpha = p.life < 30 ? p.life / 30 : p.life > p.maxLife - 30 ? (p.maxLife - p.life) / 30 : 1
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(0,245,255,${alpha * 0.15})`
        ctx!.fill()
        if (p.life > p.maxLife) particles.splice(i, 1)
      }

      animId = requestAnimationFrame(draw)
    }
    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div
      className="min-h-screen text-white font-mono relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, #1a2a40 0%, #050505 100%)' }}
    >
      {/* canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* grid */}
      <div
        className="absolute inset-0 pointer-events-none z-[1] opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,245,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.7) 100%)' }}
      />

      {/* scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-[3] opacity-[0.04]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,.08) 2px, rgba(0,245,255,.08) 4px)',
        }}
      />

      {/* content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-4 flex flex-col min-h-screen">
        {/* ═══ glassmorphism header ═══ */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-[12px] rounded-full pr-5 pl-1.5 py-1 border border-cyan-500/20 shadow-[0_0_20px_rgba(0,245,255,.06),inset_0_1px_0_rgba(255,255,255,.06)]">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-sm" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-400/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent" />
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_6px_rgba(0,245,255,.3)]" />
                )}
              </div>
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide drop-shadow-[0_0_4px_rgba(0,245,255,.1)]">
                {user?.username || first || 'Капитан'}
              </div>
              <div className="text-[5px] text-cyan-400/15 leading-tight mt-0.5 max-w-[120px]">
                Пока еще не поглощен черной дырой
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden border border-cyan-500/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 via-cyan-400/70 to-cyan-300/60"
                    style={{ width: `${xpPct}%`, boxShadow: '0 0 6px rgba(0,245,255,.2)' }}
                  />
                </div>
                <span className="text-[10px] text-cyan-400/40 font-medium">LVL {level}</span>
              </div>
            </div>
          </div>

          <div className="relative bg-white/5 backdrop-blur-[12px] rounded-lg px-3 py-2 border border-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-cyan-400/30 font-semibold tracking-wider">XGEN</span>
                <span className="text-white font-bold text-sm drop-shadow-[0_0_4px_rgba(0,245,255,.2)]">
                  {user?.balance_xgen ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-amber-400/30 font-semibold tracking-wider">📜</span>
                <span className="text-amber-300 font-bold text-sm drop-shadow-[0_0_4px_rgba(251,191,36,.2)]">
                  {user?.balance_fragments ?? 0}
                </span>
              </div>
            </div>
            <div className="text-[5px] text-cyan-400/15 leading-tight mt-1 max-w-[90px] text-right">
              *Курс валюты постоянно колеблется, но обычно не в вашу пользу
            </div>
            {/* Sound toggle tracker (easter egg) */}
            <button
              onClick={() => {
                const next = muteCount + 1
                setMuteCount(next)
                if (next >= 5) {
                  api.logEvent('toggle_sound_5x').catch(() => {})
                  setMuteCount(0)
                }
              }}
              className="absolute top-1 right-1 text-[4px] text-cyan-400/10 hover:text-cyan-400/30 transition-colors"
              title="🔊"
            >
              🔊
            </button>
          </div>
        </div>

        {/* ═══ ship section ═══ */}
        <div className="flex-1 flex flex-col items-center justify-center relative py-1">
          {/* central cluster: slots + card */}
          <div className="flex items-center justify-center relative">
            {/* left slots - overlapping card */}
            <div className="flex flex-col gap-4 z-20 -mr-2">
              {[0, 1, 2].map((i) => {
                const a = slotArtifacts[i]
                return (
                  <HexSlot
                    key={i}
                    active={!!a}
                    icon={a ? '⚙' : '+'}
                    name={a?.name_key ?? SLOT_LABELS[i].name}
                    tier={a?.tier ?? 1}
                    side="left"
                    onClick={() => handleSlotClick(i)}
                  />
                )
              })}
            </div>

            {/* lightning background */}
            <div className="absolute inset-0 pointer-events-none z-10 blur-sm">
              <svg className="w-full h-full opacity-60" viewBox="0 0 400 500" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lg-left" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.5" />
                    <stop offset="30%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="70%" stopColor="#00f5ff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="lg-right" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                    <stop offset="30%" stopColor="#00f5ff" stopOpacity="0.4" />
                    <stop offset="70%" stopColor="#a855f7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <path d="M55 60 L48 78 L60 84 L46 104 L62 114 L42 138 L64 150 L40 175" stroke="url(#lg-left)" strokeWidth="2" fill="none" style={{ animation: 'lightning-flicker 2s ease-in-out infinite' }} />
                <path d="M55 175 L50 192 L62 199 L46 214 L60 224 L42 242 L64 254 L44 272 L60 282" stroke="url(#lg-left)" strokeWidth="1.5" fill="none" style={{ animation: 'lightning-flicker 2.8s ease-in-out infinite 0.4s' }} />
                <path d="M55 282 L48 298 L62 306 L44 320 L58 332 L40 348 L64 360 L42 378" stroke="url(#lg-left)" strokeWidth="1.2" fill="none" style={{ animation: 'lightning-flicker 2.4s ease-in-out infinite 0.9s' }} />
                <path d="M345 60 L352 78 L340 84 L354 104 L338 114 L358 138 L336 150 L360 175" stroke="url(#lg-right)" strokeWidth="2" fill="none" style={{ animation: 'lightning-flicker 2s ease-in-out infinite 0.3s' }} />
                <path d="M345 175 L350 192 L338 199 L354 214 L340 224 L358 242 L336 254 L356 272 L340 282" stroke="url(#lg-right)" strokeWidth="1.5" fill="none" style={{ animation: 'lightning-flicker 2.8s ease-in-out infinite 0.7s' }} />
                <path d="M345 282 L352 298 L340 306 L356 320 L342 332 L360 348 L336 360 L358 378" stroke="url(#lg-right)" strokeWidth="1.2" fill="none" style={{ animation: 'lightning-flicker 2.4s ease-in-out infinite 1.2s' }} />
                <circle cx="55" cy="60" r="2.5" fill="#00f5ff" opacity="0.5" />
                <circle cx="55" cy="175" r="2" fill="#00f5ff" opacity="0.4" />
                <circle cx="55" cy="282" r="1.5" fill="#00f5ff" opacity="0.3" />
                <circle cx="345" cy="60" r="2.5" fill="#a855f7" opacity="0.5" />
                <circle cx="345" cy="175" r="2" fill="#a855f7" opacity="0.4" />
                <circle cx="345" cy="282" r="1.5" fill="#a855f7" opacity="0.3" />
              </svg>
            </div>

            {/* ═══ ship card ═══ */}
            <div className="relative z-10">
              <div className="absolute -inset-4 bg-gradient-to-b from-purple-500/12 via-cyan-500/8 to-purple-500/12 rounded-[18px] blur-xl animate-pulse-slow" />
              <div className="absolute -inset-2 bg-gradient-to-b from-cyan-400/4 via-purple-500/4 to-cyan-400/4 rounded-[14px] blur-md" />

              <div className="relative bg-white/5 backdrop-blur-[12px] rounded-2xl border border-cyan-500/25 p-4 w-56 shadow-[0_0_40px_rgba(0,245,255,.1),inset_0_1px_0_rgba(255,255,255,.06)]">
                <div className="text-center mb-2 relative">
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
                  <h2 className="text-white font-bold text-xs tracking-[0.2em] relative inline-block px-3 bg-white/5">
                    {shipName}
                  </h2>
                  <p className="text-[5px] text-cyan-400/15 italic tracking-wider mt-0.5">Может лететь куда угодно, кроме нужного вам места.</p>
                </div>

                {/* ship display */}
                <div className="relative aspect-square bg-gradient-to-b from-gray-800/40 to-gray-900/40 rounded-xl border border-cyan-500/15 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,.3)]">
                  <div className="absolute inset-0 opacity-20">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={`h-${i}`} className="absolute w-full h-px bg-cyan-400/30" style={{ top: `${i * 10}%` }} />
                    ))}
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={`v-${i}`} className="absolute h-full w-px bg-cyan-400/30" style={{ left: `${i * 10}%` }} />
                    ))}
                  </div>

                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_30%,rgba(0,245,255,.02))]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-glitch-sweep" />
                  <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-scanline-down" />
                  <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cyan-400/20" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cyan-400/20" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-cyan-400/20" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-cyan-400/20" />

                  {/* ship SVG */}
                  <svg viewBox="0 0 100 100" className="w-full h-full p-3 relative z-10">
                    <defs>
                      <radialGradient id="eg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#00f5ff" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="eg2" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <ellipse cx="50" cy="85" rx="12" ry="6" fill="url(#eg)" style={{ animation: 'pulse-slow 4s ease-in-out infinite' }} />
                    <ellipse cx="50" cy="88" rx="6" ry="4" fill="url(#eg2)" style={{ animation: 'pulse-slow 4s ease-in-out infinite' }} />
                    <path
                      d="M 50 8 L 42 20 L 38 35 L 35 55 L 38 75 L 45 88 L 50 92 L 55 88 L 62 75 L 65 55 L 62 35 L 58 20 Z"
                      fill="rgba(0,245,255,.02)"
                      stroke="#00f5ff"
                      strokeWidth="1.2"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(0,245,255,.15))' }}
                    />
                    <path d="M 44 25 L 44 50 M 56 25 L 56 50" stroke="#00f5ff" strokeWidth="0.3" opacity="0.4" />
                    <ellipse cx="50" cy="32" rx="5" ry="8" fill="rgba(0,245,255,.04)" stroke="#00f5ff" strokeWidth="0.8" style={{ filter: 'drop-shadow(0 0 4px rgba(0,245,255,.3))' }} />
                    <ellipse cx="50" cy="32" rx="2" ry="4" fill="#00f5ff" opacity="0.06" />
                    <path d="M 35 55 L 18 68 L 22 78 L 35 72" fill="rgba(0,245,255,.01)" stroke="#00f5ff" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 4px rgba(0,245,255,.2))' }} />
                    <line x1="25" y1="62" x2="30" y2="60" stroke="#00f5ff" strokeWidth="0.3" opacity="0.3" />
                    <path d="M 65 55 L 82 68 L 78 78 L 65 72" fill="rgba(0,245,255,.01)" stroke="#00f5ff" strokeWidth="1" style={{ filter: 'drop-shadow(0 0 4px rgba(0,245,255,.2))' }} />
                    <line x1="75" y1="62" x2="70" y2="60" stroke="#00f5ff" strokeWidth="0.3" opacity="0.3" />
                    <circle cx="50" cy="52" r="4" fill="none" stroke="#00f5ff" strokeWidth="0.8" />
                    <circle cx="50" cy="52" r="1.5" fill="#00f5ff" style={{ animation: 'pulse-slow 4s ease-in-out infinite', filter: 'drop-shadow(0 0 8px rgba(0,245,255,.6))' }} />
                    <path d="M 42 48 L 38 52 L 42 56" fill="none" stroke="#00f5ff" strokeWidth="0.5" opacity="0.5" />
                    <path d="M 58 48 L 62 52 L 58 56" fill="none" stroke="#00f5ff" strokeWidth="0.5" opacity="0.5" />
                    <path d="M 45 18 L 42 14 L 48 16" fill="none" stroke="#00f5ff" strokeWidth="0.5" opacity="0.4" />
                    <path d="M 55 18 L 58 14 L 52 16" fill="none" stroke="#00f5ff" strokeWidth="0.5" opacity="0.4" />
                    <line x1="45" y1="80" x2="45" y2="86" stroke="#00f5ff" strokeWidth="0.4" opacity="0.3" />
                    <line x1="55" y1="80" x2="55" y2="86" stroke="#00f5ff" strokeWidth="0.4" opacity="0.3" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#00f5ff" strokeWidth="0.3" opacity="0.06" strokeDasharray="3 4" />
                    <circle cx="50" cy="50" r="22" fill="none" stroke="#a855f7" strokeWidth="0.3" opacity="0.04" strokeDasharray="2 5" />
                  </svg>
                </div>

                {/* stats bar */}
                <div className="flex justify-between mt-2 text-[7px] text-cyan-400/20 tracking-wider">
                  <span>PWR {Math.round(mainShip?.fuel_current ?? 0)}/{Math.round(mainShip?.effective_stats?.max_fuel ?? 100)}</span>
                  <span>SHLD {Math.round(mainShip?.effective_stats?.max_stability ?? 100)}%</span>
                  <span>SPD {((mainShip?.effective_stats?.speed_mod ?? 1.0) + (mainShip?.effective_stats?.total_speed_bonus ?? 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* right slots - overlapping card */}
            <div className="flex flex-col gap-4 z-20 -ml-2">
              {[3, 4, 5].map((i) => {
                const a = slotArtifacts[i]
                return (
                  <HexSlot
                    key={i}
                    active={!!a}
                    icon={a ? '⚙' : '+'}
                    name={a?.name_key ?? SLOT_LABELS[i].name}
                    tier={a?.tier ?? 1}
                    side="right"
                    onClick={() => handleSlotClick(i)}
                  />
                )
              })}
            </div>
          </div>

          {/* bottom slots */}
          <div className="flex gap-8 mt-2 z-20">
              {[6, 7].map((i) => {
              const a = slotArtifacts[i]
              return (
                <HexSlot
                  key={i}
active={!!a}
                    icon={a ? '⚙' : '+'}
                    name={a?.name_key ?? SLOT_LABELS[i].name}
                  tier={a?.tier ?? 1}
                  onClick={() => handleSlotClick(i)}
                />
              )
            })}
          </div>

          {/* paper airplane — subtle bg detail */}
          <div className="absolute left-6 top-8 z-0 pointer-events-none opacity-[0.04] animate-paper-plane">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="0.5">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
            </svg>
          </div>

          {/* floating sticker — Easter egg */}
          {stickerVisible && (
          <div
            className="absolute right-2 bottom-16 z-30 cursor-pointer select-none group animate-fade-in"
            onClick={() => {
              const next = Math.min(stickerIdx + 1, STICKER_FINAL)
              setStickerIdx(next)
              localStorage.setItem(`${EGGS_LS}/state`, String(next))
              if (next === STICKER_FINAL && user && stickerIdx < STICKER_FINAL) {
                setUser({ ...user, balance_xgen: user.balance_xgen + 1 })
                api.updateProfile({ add_xgen: 1 }).then(() => useGameStore.setState({ error: null }))
                clearSpawnSchedule()
                setStickerVisible(false)
              }
              /* ── red_button_3x tracking ── */
              const newClicks = redClicks + 1
              setRedClicks(newClicks)
              localStorage.setItem(RED_BUTTON_LS, String(newClicks))
              if (newClicks >= 3) {
                setTimeout(() => api.logEvent('red_button_3x').catch(() => {}), 10_000)
                localStorage.removeItem(RED_BUTTON_LS)
                setRedClicks(0)
              }
            }}
          >
            <div className={`rotate-[6deg] hover:rotate-[-4deg] transition-transform duration-300 ${stickerIdx >= 8 ? 'animate-pulse' : ''}`}>
              <div className="bg-yellow-400/8 backdrop-blur-sm border border-yellow-400/15 rounded-md px-2 py-1 shadow-[0_0_10px_rgba(251,191,36,.08)]">
                <span className="text-[5px] font-bold tracking-wider text-yellow-400/50 whitespace-nowrap">
                  {stickerMessages[stickerIdx]}
                </span>
              </div>
              <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yellow-400/15 rotate-45 border-l border-t border-yellow-400/15" />
            </div>
          </div>
          )}

          {/* fuel + HP bars */}
          <div className="w-full max-w-[280px] mt-3 bg-white/5 backdrop-blur-[12px] rounded-xl border border-cyan-500/15 p-3 shadow-[0_0_20px_rgba(0,245,255,.04)]">
            <div className="flex flex-col gap-3">
              {/* fuel */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px] text-orange-400/40 font-semibold tracking-wider">УРОВЕНЬ ЧАЯ В БАКЕ</span>
                  <button onClick={() => setFuelLabel('ERROR 418: I\'M A TEAPOT')} className="text-[8px] text-orange-400/40 font-mono hover:text-orange-300/60 transition-colors">{fuelLabel ?? `${mainShip?.fuel_current ?? 0}/${mainShip?.effective_stats?.max_fuel ?? 100}`}</button>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-orange-500/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400"
                    style={{ width: `${Math.min(100, ((mainShip?.fuel_current ?? 50) / (mainShip?.effective_stats?.max_fuel ?? 100)) * 100)}%`, boxShadow: '0 0 6px rgba(249,115,22,.3)' }}
                  />
                </div>
                {(mainShip?.fuel_current ?? 0) < (mainShip?.effective_stats?.max_fuel ?? 100) && (
                  <button
                    disabled={!isShipIdle || fuelInInventory === 0 || isLoading}
                    onClick={handleRefuel}
                    className="w-full mt-1 py-1.5 rounded-lg bg-gradient-to-r from-orange-600/60 to-orange-400/60 text-[7px] font-bold tracking-wider text-white/70 text-center active:scale-[0.97] transition-all disabled:opacity-25 hover:from-orange-600 hover:to-orange-400 hover:text-white"
                  >
                    ☕ ЗАПРАВКА ЧАЕМ ({fuelInInventory})
                  </button>
                )}
              </div>
              {/* repair */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7px] text-green-400/40 font-semibold tracking-wider">УРОВЕНЬ ОПТИМИЗМА</span>
                  <span className="text-[8px] text-green-400/40 font-mono">{Math.round(mainShip?.stability ?? 100)}/{Math.round(mainShip?.effective_stats?.max_stability ?? 100)}</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-green-500/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400"
                    style={{ width: `${Math.min(100, ((mainShip?.stability ?? 85) / (mainShip?.effective_stats?.max_stability ?? 100)) * 100)}%`, boxShadow: '0 0 6px rgba(34,197,94,.3)' }}
                  />
                </div>
                {(mainShip?.stability ?? 0) < (mainShip?.effective_stats?.max_stability ?? 100) && (
                  <button
                    disabled={!isShipIdle || repairInInventory === 0 || isLoading}
                    onClick={handleRepair}
                    className="w-full mt-1 py-1.5 rounded-lg bg-gradient-to-r from-green-600/60 to-green-400/60 text-[7px] font-bold tracking-wider text-white/70 text-center active:scale-[0.97] transition-all disabled:opacity-25 hover:from-green-600 hover:to-green-400 hover:text-white"
                  >
                    ✨ ДОБАВИТЬ ОПТИМИЗМА ({repairInInventory})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ expedition status / launch ═══ */}
        <div className="flex justify-center w-full mt-2">
          <div className="w-full max-w-[280px] bg-white/5 backdrop-blur-[12px] rounded-xl border border-cyan-500/15 p-3 shadow-[0_0_20px_rgba(0,245,255,.04)]">
            {activeExp ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[7px] text-cyan-400/40 font-semibold tracking-wider">ЭКСПЕДИЦИЯ</span>
                  <span className="text-[7px] text-cyan-400/30">{activeZoneName}</span>
                </div>
                {expTimer && !expTimer.isComplete ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] text-cyan-400/50 font-mono">🚀 {expTimer.display}</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-cyan-500/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                        style={{ width: `${expTimer.pct}%`, boxShadow: '0 0 6px rgba(0,245,255,.3)' }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    disabled={isLoading}
                    onClick={handleClaimExpedition}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-green-600/80 to-green-400/80 text-[9px] font-bold tracking-wider text-white/90 text-center active:scale-[0.97] transition-all disabled:opacity-40"
                  >
                    {isLoading ? 'ЗАБИРАЮ...' : '🎁 ЗАБРАТЬ НАГРАДУ'}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/galaxy')}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-neon-cyan/80 to-neon-purple/80 text-[9px] font-bold tracking-wider text-white/90 text-center active:scale-[0.97] transition-all hover:from-neon-cyan hover:to-neon-purple"
              >
                🚀 ЗАПУСК ЭКСПЕДИЦИИ
              </button>
            )}
          </div>
        </div>

        {/* ═══ console panel ═══ */}
        <div className="mt-2 mb-4 relative">
          <div className="absolute -inset-4 bg-gradient-to-t from-purple-500/5 via-cyan-500/3 to-transparent rounded-2xl blur-2xl pointer-events-none" />
          <div className="relative bg-white/5 backdrop-blur-[12px] rounded-2xl border border-cyan-500/20 p-5 shadow-[0_0_30px_rgba(0,245,255,.06),inset_0_1px_0_rgba(255,255,255,.06)]">
            <div className="text-center mb-4 relative">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/8 to-transparent" />
              <span className="text-[9px] font-bold tracking-[0.2em] text-cyan-400/30 relative inline-block px-3 bg-white/5">
                ПАНЕЛЬ СЛОЖНЫХ РЕШЕНИЙ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 relative">
              {consoleButtons.map((btn, i) => (
                <button
                  key={i}
                  className="group relative overflow-hidden rounded-xl p-0 transition-all duration-200 active:scale-[0.95] hover:scale-[1.03]"
                  style={{
                    background: `conic-gradient(from var(--gradient-angle, 0deg), ${btn.accent}00 0%, ${btn.accent}55 25%, ${btn.accent}00 50%, ${btn.accent}55 75%, ${btn.accent}00 100%)`,
                    animation: 'spin-gradient 4s linear infinite',
                  }}
                  onClick={() => {
                    if (btn.path) navigate(btn.path)
                    if (btn.msg) setConsoleMsg(btn.msg)
                  }}
                >
                  {/* button body with metallic bevel */}
                  <div className="relative m-[1.5px] rounded-[10.5px] bg-gradient-to-b from-gray-800/80 to-gray-950/90 border-t border-l border-white/12 border-b border-r border-black/40 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,.4)]">
                    {/* metallic highlight */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                    {/* hover glow */}
                    <div
                      className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at center, ${btn.accent}25, transparent)` }}
                    />

                    {/* label */}
                    <div className="relative flex flex-col items-center justify-center py-3 px-4">
                      <span
                        className="text-[11px] font-bold tracking-[0.15em] transition-all duration-200"
                        style={{
                          color: btn.accent,
                          textShadow: `0 0 14px ${btn.accent}66`,
                        }}
                      >
                        {btn.label}
                      </span>
                      {btn.sub && (
                        <span className="text-[5px] text-white/20 tracking-wider mt-0.5 leading-tight">
                          {btn.sub}
                        </span>
                      )}
                    </div>

                    {/* bottom accent line */}
                    <div
                      className="absolute bottom-0 left-[15%] right-[15%] h-[1.5px] opacity-40"
                      style={{ background: `linear-gradient(90deg, transparent, ${btn.accent}, transparent)`, boxShadow: `0 0 8px ${btn.accent}66` }}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* console message toast */}
            {consoleMsg && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-fade-in">
                <div className="bg-black/70 backdrop-blur-sm border border-cyan-500/20 rounded-lg px-3 py-1.5 shadow-[0_0_16px_rgba(0,245,255,.1)] whitespace-nowrap">
                  <span className="text-[8px] text-cyan-400/60 font-mono tracking-wider">{consoleMsg}</span>
                </div>
                <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-2 h-2 bg-black/70 border-r border-b border-cyan-500/20 rotate-45" />
              </div>
            )}
          </div>
        </div>
      </div>

      <SlotSelectModal
        open={slotModalIndex !== null}
        slotIndex={slotModalIndex ?? 0}
        equippedArtifact={slotModalIndex !== null ? slotArtifacts[slotModalIndex] : null}
        inventory={inventory}
        artifactsContent={artifactsContent}
        onEquip={(artifactId) => {
          if (mainShip && slotModalIndex !== null) {
            equipSlot(mainShip.id, slotModalIndex, artifactId)
            closeModal()
          }
        }}
        onUnequip={() => {
          if (mainShip && slotModalIndex !== null) {
            unequipSlot(mainShip.id, slotModalIndex)
            closeModal()
          }
        }}
        onClose={closeModal}
      />
    </div>
  )
}
