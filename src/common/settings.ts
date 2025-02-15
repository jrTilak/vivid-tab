import type { Settings } from "@/zod/settings"

export const DEFAULT_SETTINGS = {
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
} as any
