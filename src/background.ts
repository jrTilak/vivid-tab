import { z } from "zod"
import { ALARMS, BACKGROUND_ACTIONS, } from "./constants/background-actions"
import { LOCAL_STORAGE } from "./constants/keys"
import { wallpaper } from "./lib/wallpapers"

/**
 * Handles background communication
 */
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.action) {
    case BACKGROUND_ACTIONS.GET_BOOKMARKS:
      chrome.bookmarks.getTree((bookmarkTree) => {
        sendResponse(bookmarkTree)
      })

      return true

    case BACKGROUND_ACTIONS.GET_HISTORY:
      chrome.history.search({ text: "" }, (historyItems) => {
        sendResponse(historyItems?.slice(0, 30) || [])
      })

      return true

    case BACKGROUND_ACTIONS.SEARCH_QUERY:
      {
        // eslint-disable-next-line prefer-const
        let { query, openIn } = message as {
          query: string
          openIn: "new-tab" | "current-tab"
        }

        let { success: isValidUrl } = z.string().url().safeParse(query)

        // for example, google.com is a valid url
        if (
          !isValidUrl &&
          query
            .split(".")
            .map((part) => part.trim())
            .filter(Boolean).length >= 2
        ) {
          isValidUrl = true
          query = "https://" + query
        }

        if (isValidUrl) {
          if (openIn === "new-tab") {
            chrome.tabs.create({ url: query })
          } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { url: query })
              }
            })
          }
        } else {
          chrome.search.query({
            text: query,
            disposition: openIn === "new-tab" ? "NEW_TAB" : "CURRENT_TAB",
          })
        }
      }

      return true
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/welcome.html") })

    // also save installed date 
    chrome.storage.local.set({ [LOCAL_STORAGE.installedDate]: new Date().toString() })

    // Also fetch images when extension starts
    wallpaper.fetchOnlineImages(true)
  }

  // Set up alarm for hourly image fetching
  chrome.alarms.create(ALARMS.FETCH_ONLINE_IMAGES, { periodInMinutes: 60 * 3 })

  // Set up alarm for downloading pending images (every 5 minutes)
  chrome.alarms.create(ALARMS.DOWNLOAD_PENDING_IMAGES, { periodInMinutes: 5 })
})

// Handle alarm for periodic image fetching
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case ALARMS.FETCH_ONLINE_IMAGES:
      wallpaper.fetchOnlineImages()
      break

    case ALARMS.DOWNLOAD_PENDING_IMAGES:
      wallpaper.downloadPendingImages()
      break

    default:
      break
  }
})

// Also download pending images on startup
chrome.runtime.onStartup.addListener(() => {
  wallpaper.downloadPendingImages()
})

if (process.env.PLASMO_PUBLIC_UNINSTALL_URL) {
  chrome.runtime.setUninstallURL(process.env.PLASMO_PUBLIC_UNINSTALL_URL)
}
