import { useCallback, useEffect, useState } from "react"

export interface UseShortcutKeyConfig {
  keys: string[] // Array of keys that must be pressed together
  callback?: <T>(event: T) => void // Callback triggered when the key combination is pressed
  autoEnable?: boolean // Whether to enable the shortcut listening by default (default: true)
}

/**
 * triggers a callback or click on specified keyboard shortcuts, with options to enable/disable and prevent default actions.
 */
const useShortcutKey = (config: UseShortcutKeyConfig) => {
  const { keys, callback, autoEnable = true } = config

  const [isEnabled, setIsEnabled] = useState(autoEnable) // Track whether the listener is enabled

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMatch = keys.every((key) => {
        if (key === "Control") return event.ctrlKey
        if (key === "Shift") return event.shiftKey
        if (key === "Alt") return event.altKey

        return event.key === key || event.code === key
      })

      if (isMatch) {
        if (callback) {
          callback(event)
        }
      }
    },
    [keys, callback],
  )

  useEffect(() => {
    if (!isEnabled) return

    const handler = (event: KeyboardEvent) => handleKeyDown(event)

    // Add the event listener if enabled
    window.addEventListener("keydown", handler)

    // Cleanup the event listener when the component unmounts or dependencies change
    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [handleKeyDown, isEnabled])

  // Functions to enable and disable the event listener
  const enable = () => setIsEnabled(true)
  const disable = () => setIsEnabled(false)

  return { enable, disable, isEnabled }
}

export default useShortcutKey
