import type { Variants } from 'motion/react'

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

export const cardHover = {
  whileHover: { scale: 1.02, y: -2, transition: { type: 'spring' as const, stiffness: 400, damping: 17 } } as const,
  whileTap: { scale: 0.98 } as const,
}

export const xpBarVariants: Variants = {
  hidden: { width: '0%' },
  visible: (pct: number) => ({
    width: `${pct}%`,
    transition: { duration: 1, ease: 'easeOut' as const, delay: 0.3 },
  }),
}
