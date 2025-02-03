import type { SettingsConfig } from "@/types/setting-types"

export const SETTING_TRIGGER_POSITIONS = {
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right"
} as const

export type SettingIconPosition =
  (typeof SETTING_TRIGGER_POSITIONS)[keyof typeof SETTING_TRIGGER_POSITIONS]

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
    showSeconds: false
  },
  temperature: {
    unit: "celsius"
  },
  quotes: {
    categories: []
  },
  todos: {
    expireAfterCompleted: {
      enabled: true,
      durationInMinutes: 60 // 1 hour
    }
  },
  wallpapers: {
    selectedImageId: null,
    images: []
  },
  layout: {
    0: "searchbar",
    1: "clock",
    2: "weather",
    3: "todos",
    4: "bookmarks",
    5: "quotes",
    6: "notes"
  },
  general: {
    rootFolder: "0",
    showHistory: true,
    layout: "grid"
  }
}
