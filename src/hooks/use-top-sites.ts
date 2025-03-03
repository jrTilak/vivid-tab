import { useEffect, useState } from "react"

/**
 * Custom hook to fetch and manage browser top sites items.
 */
const useTopSites = () => {
  const [topSites, setTopSites] = useState<chrome.topSites.MostVisitedURL[]>([])

  useEffect(() => {
    chrome.topSites.get((topSitesItems) => {
      setTopSites(topSitesItems?.slice(0, 30) || [])
    })
  }, [])

  return topSites
}

export type TopSite = chrome.topSites.MostVisitedURL
export default useTopSites
