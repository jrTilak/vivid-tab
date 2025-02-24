import { BACKGROUND_ACTIONS } from "@/constants/background-actions"
import { useEffect, useState } from "react"

type Props = {
  query: string
  enabled?: boolean
}

const useSearchSuggestions = ({ query, enabled = true }: Props) => {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (!enabled) return

    chrome.runtime.sendMessage(
      { action: BACKGROUND_ACTIONS.GET_SEARCH_SUGGESTIONS, query },
      (response: string[]) => {
        setSuggestions(response)
      },
    )
  }, [query, enabled])

  return suggestions
}

export default useSearchSuggestions
