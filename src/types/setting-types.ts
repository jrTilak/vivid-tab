import type { SettingIconPosition } from "@/common/settings"

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
  }
  temperature: {
    unit: "celsius" | "fahrenheit"
  }
  quotes: {
    categories: string[]
  }
  todos: {
    expireAfterCompleted: {
      enabled: boolean
      durationInMinutes: number
    }
  }
  wallpapers: {
    selectedImgIndex: number
  }
  layout: Record<number, string>
}
