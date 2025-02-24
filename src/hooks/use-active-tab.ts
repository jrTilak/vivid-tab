import { useState } from "react"

import useAsyncEffect from "./use-async-effect"

const useActiveTab = () => {
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

export default useActiveTab
