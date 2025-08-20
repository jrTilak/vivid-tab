import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys"

export interface PixabayImage {
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

interface StoredImage {
  id: string
  src: string
  source: "pixabay" | "local"
  pixabayId?: number
  tags?: string
  user?: string
  fetchedAt: number
}

class Pixabay {
  private _apiKey: string

  constructor() {
    this._apiKey = process.env.PLASMO_PUBLIC_PIXABAY_API_KEY || ""
  }

  /**
   * Fetches images from Pixabay API
   */
  async fetchImages(
    keywords: string = "",
    count: number = 10,
  ): Promise<PixabayImage[]> {
    try {
      if (!this._apiKey) {
        console.warn("Pixabay API key not found")
        
return []
      }

      const searchTerm = keywords.split(",").map((k) => k.trim())
      const images: PixabayImage[] = []

      for (const term of searchTerm) {
        const url = `https://pixabay.com/api/?key=${this._apiKey}&q=${encodeURIComponent(term)}&image_type=photo&per_page=${count}&safesearch=true&orientation=horizontal`

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
  private async _downloadImageAsBase64(
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
  async storeImage(
    imageUrl: string,
    pixabayId: number,
    tags: string,
    user: string,
  ): Promise<string | null> {
    try {
      const base64Image = await this._downloadImageAsBase64(imageUrl)

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
          const imageObject: StoredImage = {
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
   * Deletes all online images from IndexedDB while preserving local uploads
   */
  private async _deleteOnlineImages(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ImageDB", 1)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction("images", "readwrite")
        const store = transaction.objectStore("images")
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          const allImages = getAllRequest.result as StoredImage[]
          const onlineImages = allImages.filter(img => img.source === "pixabay")

          let deletedCount = 0
          const totalToDelete = onlineImages.length

          if (totalToDelete === 0) {
            resolve()
            
return
          }

          onlineImages.forEach(image => {
            const deleteRequest = store.delete(image.id)

            deleteRequest.onsuccess = () => {
              deletedCount++

              if (deletedCount === totalToDelete) {
                console.log(`Deleted ${deletedCount} online images from IndexedDB`)
                resolve()
              }
            }

            deleteRequest.onerror = () => {
              reject(new Error(`Failed to delete image ${image.id}`))
            }
          })
        }

        getAllRequest.onerror = () => {
          reject(new Error("Failed to get images from IndexedDB"))
        }
      }

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"))
      }
    })
  }

  /**
   * Stores multiple Pixabay images, replacing all existing online images
   * while preserving manually uploaded local images
   */
  async storePixabayImages(
    images: PixabayImage[],
  ): Promise<string[]> {
    try {
      // First, delete all existing online images
      await this._deleteOnlineImages()

      // Store new images and collect their IDs
      const imageIds: string[] = []

      for (const image of images) {
        try {
          const imageId = await this.storeImage(
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

      console.log(
        `Successfully replaced online images with ${imageIds.length} new images from Pixabay`,
      )

      return imageIds
    } catch (error) {
      console.error("Error in storePixabayImages:", error)
      
return []
    }
  }

  /**
   * Fetches online images from Pixabay if conditions are met
   */
  async fetchOnlineImagesIfNeeded(): Promise<void> {
    try {
      // Get settings from storage
      const result = await chrome.storage.sync.get("settings")

      if (!result.settings) {
        return
      }

      const settings = JSON.parse(result.settings)
      const { wallpapers, background } = settings

      // Check if online images are enabled
      if (!wallpapers?.onlineImages?.enabled) {
        return
      }

      // Don't fetch online images if wallpaper randomization is turned off
      if (background?.randomizeWallpaper === "off") {
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
      const images = await this.fetchImages(
        wallpapers.onlineImages.keywords || "",
        10,
      )

      if (images.length === 0) {
        console.log("No images fetched from Pixabay")
        
return
      }

      // Store images using the new method that replaces old ones
      const imageIds = await this.storePixabayImages(images)

      if (imageIds.length > 0) {
        // Get current settings to preserve local images
        const currentResult = await chrome.storage.sync.get("settings")
        const currentSettings = JSON.parse(currentResult.settings)
        
        // Get all images from IndexedDB to filter local ones
        const allStoredImages = await this.getAllStoredImages()
        const localImageIds = allStoredImages
          .filter(img => img.source === "local")
          .map(img => img.id)

        // Update settings with new online image IDs plus existing local ones
        const updatedSettings = {
          ...currentSettings,
          wallpapers: {
            ...currentSettings.wallpapers,
            images: [...localImageIds, ...imageIds],
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

  /**
   * Gets all stored images from IndexedDB
   */
  async getAllStoredImages(): Promise<StoredImage[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ImageDB", 1)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction("images", "readonly")
        const store = transaction.objectStore("images")
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result as StoredImage[])
        }

        getAllRequest.onerror = () => {
          reject(new Error("Failed to get images from IndexedDB"))
        }
      }

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"))
      }
    })
  }
}

// Export instance
export const pixabay = new Pixabay()
