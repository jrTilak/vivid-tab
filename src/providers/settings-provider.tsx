import { DEFAULT_SETTINGS } from "@/constants/settings"
import { SettingsSchema, type Settings } from "@/zod/settings"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

const SYNC_DEBOUNCE_MS = 400

interface SettingsContextState {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextState | undefined>(
  undefined,
)

const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  const [settings, setSettings] = useState<Settings>(
    DEFAULT_SETTINGS as unknown as Settings,
  )

  const resetSettings = useCallback(async () => {
    chrome.storage.sync.clear()
    chrome.storage.local.clear()

    // Only clear extension's wallpaper DB (do not wipe other origin DBs)
    indexedDB.deleteDatabase("ImageDB")

    setSettings(DEFAULT_SETTINGS as unknown as Settings)
  }, [])

  useEffect(() => {
    chrome.storage.sync.get("settings", (result) => {
      const raw = result?.settings
      let parsed: Settings = DEFAULT_SETTINGS as unknown as Settings

      if (raw) {
        try {
          parsed = SettingsSchema.parse(JSON.parse(raw))
        } catch (err) {
          console.error("Failed to parse settings:", err)
        }
      }

      setSettings(parsed)
      setIsLoaded(true)
    })

    // Listen for changes to settings in Chrome storage
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "sync" && changes.settings) {
        const raw = changes.settings.newValue

        if (raw) {
          try {
            const parsed = SettingsSchema.parse(JSON.parse(raw))
            // Only update if the new value is different from current settings
            setSettings((prev) => {
              if (JSON.stringify(prev) !== raw) {
                return parsed
              }

              return prev
            })
          } catch (err) {
            console.error("Failed to parse settings from storage change:", err)
          }
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)

    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null
      chrome.storage.sync.set({
        settings: JSON.stringify(settings),
      })
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = null
      }
    }
  }, [settings, isLoaded])

  const value: SettingsContextState = {
    settings,
    setSettings,
    resetSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {isLoaded && children}
    </SettingsContext.Provider>
  )
}

const useSettings = () => {
  const context = useContext(SettingsContext)

  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }

  return context
}

export { SettingsProvider, useSettings }
