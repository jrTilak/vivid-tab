import { useState } from "react"

import { useAsyncEffect } from "./use-async-effect"

/**
 * Gets the active tab ID from the current browser window
 * Useful for tracking which tab the user is currently viewing
 */
const useBrowserActiveTab = () => {
  const [activeTabId, setActiveTabId] = useState<number>()

  useAsyncEffect(async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (tab && tab.id) {
        setActiveTabId(tab.id)
      }
    } catch (error) {
      console.error("Error fetching active tab:", error)
    }
  }, [])

  return activeTabId
}

export { useBrowserActiveTab }
