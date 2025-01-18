import type {
  SettingIconPosition,
  TimerPosition,
  TimerSize
} from "@/common/settings"

export type SettingsButtonConfig = {
  position: SettingIconPosition
  size: number
  opacity: number
}

export type SettingsConfig = {
  others: {
    triggerButton: SettingsButtonConfig
  }
  timer: {
    timeFormat: "12h" | "24h"
    showSeconds: boolean
    showTimer: boolean
    position: TimerPosition
    showGreetings: boolean
    greetingsText: string
    margin: number
    size: TimerSize
  }
}
