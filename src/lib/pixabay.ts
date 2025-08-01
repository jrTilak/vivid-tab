import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys"

interface PixabayImage {
  id: number
  webformatURL: string
  user: string
  tags: string
}

interface PixabayResponse {
  hits: PixabayImage[]
  total: number
  totalHits: number
}

/**
 * Fetches images from Pixabay API
 */
export async function fetchPixabayImages(
  keywords: string = "",
  count: number = 10,
): Promise<PixabayImage[]> {
  try {
    const apiKey = process.env.PLASMO_PUBLIC_PIXABAY_API_KEY || ""

    if (!apiKey) {
      console.warn("Pixabay API key not found")

      return []
    }

    const searchTerm = keywords.split(",").map((k) => k.trim())
    // for each search term, fetch images
    const images: PixabayImage[] = []

    for (const term of searchTerm) {
      const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(term)}&image_type=photo&per_page=${count}&safesearch=true&orientation=horizontal`

      const response = await fetch(url)

      if (!response.ok) {
        continue
      }

      const data: PixabayResponse = await response.json()
      images.push(...data.hits)
    }

    return images
  } catch (error) {
    console.error("Error fetching Pixabay images:", error)

    return []
  }
}

/**
 * Downloads an image and converts it to base64
 */
export async function downloadImageAsBase64(
  url: string,
): Promise<string | null> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () =>
        reject(new Error("Failed to convert image to base64"))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error downloading image:", error)

    return null
  }
}

/**
 * Stores a Pixabay image in IndexedDB
 */
export async function storePixabayImage(
  imageUrl: string,
  pixabayId: number,
  tags: string,
  user: string,
): Promise<string | null> {
  try {
    const base64Image = await downloadImageAsBase64(imageUrl)

    if (!base64Image) {
      return null
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ImageDB", 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "id" })
        }
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction("images", "readwrite")
        const store = transaction.objectStore("images")

        const imageId = `pixabay_${pixabayId}_${Date.now()}`
        const imageObject = {
          id: imageId,
          src: base64Image,
          source: "pixabay",
          pixabayId,
          tags,
          user,
          fetchedAt: Date.now(),
        }

        store.put(imageObject)

        transaction.oncomplete = () => {
          console.log("Pixabay image stored with ID:", imageId)
          resolve(imageId)
        }

        transaction.onerror = () => {
          reject(new Error("Failed to store image in IndexedDB"))
        }
      }

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"))
      }
    })
  } catch (error) {
    console.error("Error storing Pixabay image:", error)

    return null
  }
}

/**
 * Fetches online images from Pixabay if conditions are met
 */
export async function fetchOnlineImagesIfNeeded(): Promise<void> {
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
    const lastFetchResult = await chrome.storage.local.get([
      LAST_ONLINE_IMAGES_FETCHED_AT,
    ])
    const lastFetchTime = lastFetchResult[LAST_ONLINE_IMAGES_FETCHED_AT]

    if (lastFetchTime) {
      const timeDiff = Date.now() - parseInt(lastFetchTime)
      const hourInMs = 60 * 60 * 1000

      if (timeDiff < hourInMs) {
        console.log("Not time yet")

        return // Not time yet
      }
    }

    // Check if Chrome is active (has active tabs)
    const tabs = await chrome.tabs.query({ active: true })

    if (tabs.length === 0) {
      console.log("Chrome not active")

      return // Chrome not active
    }

    console.log("Fetching new images from Pixabay...")

    // Fetch images from Pixabay
    const images = await fetchPixabayImages(
      wallpapers.onlineImages.keywords || "",
      10,
    )

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
          image.user,
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

      console.log(
        `Successfully fetched and stored ${imageIds.length} images from Pixabay`,
      )
    }
  } catch (error) {
    console.error("Error in fetchOnlineImagesIfNeeded:", error)
  }
}
