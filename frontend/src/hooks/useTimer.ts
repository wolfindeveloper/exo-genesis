import { useEffect, useMemo, useState } from 'react'

export interface TimerData {
  display: string
  pct: number
  isComplete: boolean
  remainingSeconds: number
}

export function useExpeditionTimer(
  startTimeIso: string | null,
  endTimeIso: string | null,
): TimerData | null {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!startTimeIso || !endTimeIso) return
    const endMs = new Date(endTimeIso).getTime()
    if (Date.now() >= endMs) return
    const id = setInterval(() => {
      const n = Date.now()
      setNow(n)
      if (n >= endMs) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [startTimeIso, endTimeIso])

  return useMemo(() => {
    if (!startTimeIso || !endTimeIso) return null
    const start = new Date(startTimeIso).getTime()
    const end = new Date(endTimeIso).getTime()
    if (isNaN(start) || isNaN(end)) return null
    const elapsed = now - start
    const total = end - start
    const remaining = Math.max(0, end - now)
    const isComplete = remaining <= 0
    const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0

    const totalSec = Math.floor(remaining / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60

    const display = isComplete
      ? 'Завершено'
      : h > 0
        ? `${h}ч ${m}м`
        : m > 0
          ? `${m}м ${s}с`
          : `${s}с`

    return { display, pct, isComplete, remainingSeconds: totalSec }
  }, [startTimeIso, endTimeIso, now])
}
