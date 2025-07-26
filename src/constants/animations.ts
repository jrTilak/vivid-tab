export const ANIMATION_PROPS = {
  leftToRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    duration: 0.5,
  },
  rightToLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    duration: 0.5,
  },
} as const

export type Animation = keyof typeof ANIMATION_PROPS
