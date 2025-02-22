import type { HistoryItem } from "@/types/history-types"
import { useEffect, useState } from "react"

/**
 * Custom hook to fetch and manage browser history items.
 */
const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    chrome.history.search(
      { text: "", maxResults: 30, startTime: 0, endTime: Date.now() },
      (historyItems) => {
        setHistory(
          historyItems?.slice(0, 30)?.map((item) => ({
            id: item.id,
            title: item.title,
            url: item.url,
            lastVisitTime: item.lastVisitTime,
            visitCount: item.visitCount,
          })) || [],
        )
      },
    )
  }, [])

  return history
}

export default useHistory
