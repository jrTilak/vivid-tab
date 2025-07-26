import type { HistoryItem } from "@/types/history"
import { useEffect, useState } from "react"

const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    chrome.permissions.contains({ permissions: ["history"] }, (granted) => {
      setHasPermission(granted)
      if (granted) fetchHistory()
    })
  }, [])

  const requestPermission = () => {
    chrome.permissions.request({ permissions: ["history"] }, (granted) => {
      setHasPermission(granted)
      if (granted) fetchHistory()
    })
  }

  const fetchHistory = () => {
    chrome.history.search(
      { text: "", maxResults: 30, startTime: 0, endTime: Date.now() },
      (historyItems) => {
        setHistory(
          historyItems?.map((item) => ({
            id: item.id,
            title: item.title,
            url: item.url,
            lastVisitTime: item.lastVisitTime,
            visitCount: item.visitCount,
          })) || [],
        )
      },
    )
  }

  return { history, hasPermission, requestPermission }
}

export { useHistory }
