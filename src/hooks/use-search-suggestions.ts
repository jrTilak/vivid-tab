import { useState } from "react"
import useAsyncEffect from "./use-async-effect"

type Props = {
  query: string
  enabled?: boolean
}

/**
 * Custom hook to fetch search suggestions based on the query.
 */
const useSearchSuggestions = ({ query, enabled = true }: Props) => {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useAsyncEffect(async () => {
    const results = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${query}`,
    )
    const data = await results.json()

    setSuggestions(data[1])
  }, [query, enabled])

  return suggestions
}

export default useSearchSuggestions
