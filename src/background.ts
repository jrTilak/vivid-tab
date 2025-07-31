import { z } from "zod"
import { BACKGROUND_ACTIONS } from "./constants/background-actions"
import { LAST_ONLINE_IMAGES_FETCHED_AT } from "./constants/keys"
import { fetchPixabayImages, storePixabayImage } from "./lib/pixabay"

/**
 * Fetches online images from Pixabay if conditions are met
 */
async function fetchOnlineImagesIfNeeded(): Promise<void> {
  try {
    // Get settings from storage
    const result = await chrome.storage.sync.get("settings")
    
    if (!result.settings) {
      return
    }

    const settings = JSON.parse(result.settings)
    const { wallpapers } = settings

    // Check if online images are enabled
    if (!wallpapers?.onlineImages?.enabled) {
      return
    }

    // Check if it's time to fetch new images (hourly)
    const lastFetchResult = await chrome.storage.local.get([LAST_ONLINE_IMAGES_FETCHED_AT])
    const lastFetchTime = lastFetchResult[LAST_ONLINE_IMAGES_FETCHED_AT]

    if (lastFetchTime) {
      const timeDiff = Date.now() - parseInt(lastFetchTime)
      const hourInMs = 60 * 60 * 1000
      
      if (timeDiff < hourInMs) {
        return // Not time yet
      }
    }

    // Check if Chrome is active (has active tabs)
    const tabs = await chrome.tabs.query({ active: true })
    
    if (tabs.length === 0) {
      return // Chrome not active
    }

    console.log("Fetching new images from Pixabay...")

    // Fetch images from Pixabay
    const images = await fetchPixabayImages(wallpapers.onlineImages.keywords || "", 10)
    
    if (images.length === 0) {
      console.log("No images fetched from Pixabay")
      
return
    }

    // Store images in IndexedDB and collect their IDs
    const imageIds: string[] = []
    
    for (const image of images) {
      try {
        const imageId = await storePixabayImage(
          image.webformatURL,
          image.id,
          image.tags,
          image.user
        )
        
        if (imageId) {
          imageIds.push(imageId)
        }
      } catch (error) {
        console.error("Error storing image:", error)
      }
    }

    if (imageIds.length > 0) {
      // Update settings with new image IDs
      const updatedSettings = {
        ...settings,
        wallpapers: {
          ...settings.wallpapers,
          images: [...(settings.wallpapers.images || []), ...imageIds],
        },
      }

      await chrome.storage.sync.set({
        settings: JSON.stringify(updatedSettings),
      })

      // Update last fetch time
      await chrome.storage.local.set({
        [LAST_ONLINE_IMAGES_FETCHED_AT]: Date.now().toString(),
      })

      console.log(`Successfully fetched and stored ${imageIds.length} images from Pixabay`)
    }
  } catch (error) {
    console.error("Error in fetchOnlineImagesIfNeeded:", error)
  }
}

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
  }
  
  // Set up alarm for hourly image fetching
  chrome.alarms.create("fetchOnlineImages", { periodInMinutes: 60 })
})

// Handle alarm for periodic image fetching
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchOnlineImages") {
    fetchOnlineImagesIfNeeded()
  }
})

// Also fetch images when extension starts
fetchOnlineImagesIfNeeded()
