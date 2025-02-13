import { DEFAULT_SETTINGS_CONFIG } from "@/common/settings"
import type { SettingsConfig } from "@/types/setting-types"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react"

interface SettingsContextState {
  settings: SettingsConfig
  setSettings: React.Dispatch<React.SetStateAction<SettingsConfig>>
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextState | undefined>(
  undefined
)

const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [settings, setSettings] = useState<SettingsConfig>(
    DEFAULT_SETTINGS_CONFIG
  )

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS_CONFIG)
  }, [])

  //  Load settings from storage
  useEffect(() => {
    chrome.storage.sync.get("settings", ({ settings }) => {
      let s = DEFAULT_SETTINGS_CONFIG
      if (settings) {
        try {
          s = JSON.parse(settings)
        } catch (error) {
          s = DEFAULT_SETTINGS_CONFIG
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
    resetSettings
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
