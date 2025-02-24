import { DEFAULT_SETTINGS } from "@/constants/settings"
import { SettingsSchema, type Settings } from "@/zod/settings"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

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

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS as unknown as Settings)
  }, [])

  //  Load settings from storage
  useEffect(() => {
    chrome.storage.sync.get("settings", ({ settings }) => {
      let s: Settings = DEFAULT_SETTINGS as unknown as Settings

      if (settings) {
        try {
          s = SettingsSchema.parse(JSON.parse(settings))
        } catch (error) {
          console.error(error)
        }
      }

      setSettings(s)
      setIsLoaded(true)
    })
  }, [])

  // Save settings to storage on change
  useEffect(() => {
    if (isLoaded) {
      chrome.storage.sync.set({ settings: JSON.stringify(settings) })
    }
  }, [settings, isLoaded])

  const value: SettingsContextState = {
    setSettings,
    settings,
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

  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }

  return context
}

export { SettingsProvider, useSettings }
