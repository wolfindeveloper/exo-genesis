import { useEffect, useRef, useState } from 'react'

export function useCountUp(value: number, duration = 1000, disabled = false): number {
  const [display, setDisplay] = useState(() => (disabled ? value : 0))
  const prevValue = useRef(value)
  const disabledRef = useRef(disabled)

  useEffect(() => {
    disabledRef.current = disabled
    if (disabled) {
      prevValue.current = value
      setDisplay(value)
      return
    }
    const start = prevValue.current
    const startTime = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 2)
      setDisplay(Math.round(start + (value - start) * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    prevValue.current = value
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, disabled])

  return display
}
