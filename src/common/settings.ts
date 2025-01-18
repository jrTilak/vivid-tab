import type { SettingsConfig } from "@/types/setting-types"

export const SETTING_TRIGGER_POSITIONS = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right"
} as const

export type SettingIconPosition =
  (typeof SETTING_TRIGGER_POSITIONS)[keyof typeof SETTING_TRIGGER_POSITIONS]

export const TIMER_POSITIONS = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  CENTER: "center"
} as const

export type TimerPosition =
  (typeof TIMER_POSITIONS)[keyof typeof TIMER_POSITIONS]

export const TIMER_SIZE = {
  XS: "extra-small",
  SM: "small",
  MD: "medium",
  LG: "large",
  XL: "extra-large"
} as const

export type TimerSize = (typeof TIMER_SIZE)[keyof typeof TIMER_SIZE]

export const DEFAULT_SETTINGS_CONFIG: SettingsConfig = {
  others: {
    triggerButton: {
      position: SETTING_TRIGGER_POSITIONS.BOTTOM_RIGHT,
      size: 20,
      opacity: 0.7
    }
  },
  timer: {
    timeFormat: "12h",
    showSeconds: false,
    position: TIMER_POSITIONS.CENTER,
    showTimer: true,
    showGreetings: true,
    greetingsText: "{{GREET}}",
    margin: 0,
    size: "small"
  }
}
