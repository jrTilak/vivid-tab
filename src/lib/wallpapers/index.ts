import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys"
import { openImageDB } from "@/lib/db/indexeddb"
import { Pixabay } from "./extensions/pixabay"
import { Wallhaven } from "./extensions/wallhaven"

/**
 * What IndexedDB actually stores
 */
export interface StoredImage {
  id: string
  src: string // base64 dataURL or URL if not yet downloaded
  source: string // "pixabay" | "local" | "wallhaven"
  fetchedAt: number
  downloaded?: boolean // true if src is base64, false/undefined if src is still a URL
  originalUrl?: string // the original URL before download
  downloadAttempts?: number // number of download attempts
  downloadFailed?: boolean // true if download has permanently failed
}

/**
 * What an extension returns (image URLs only)
 */
export type ExternalImage = string

/**
 * Extension interface (Pixabay/etc)
 */
export interface WallpaperExtension {
  sourceName: string
  fetchImages(keywords?: string[], count?: number): Promise<ExternalImage[]>
}

class Wallpaper {
  private _extensions: Record<string, WallpaperExtension> = {}
  private _activeExtensionName: string

  constructor() {
    this._addExtension(new Pixabay())
    this._addExtension(new Wallhaven())
    this._activeExtensionName = "wallhaven"
  }

  /**
   * Register an extension
   */
  private _addExtension(extension: WallpaperExtension) {
    this._extensions[extension.sourceName] = extension
  }

  /**
   * Convert comma-separated keywords
   */
  private _formatKeywords = (keywords?: string) => {
    return (
      keywords
        ?.split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean) || []
    )
  }

  /**
   * Fetch from a specific extension
   */
  private async _fetchImagesFromExtension(
    extensionName: string,
    keywords = "",
    count = 10,
  ): Promise<ExternalImage[]> {
    const ext = this._extensions[extensionName]

    if (!ext) {
      console.warn(`Extension ${extensionName} not found`)

      return []
    }

    return ext.fetchImages(this._formatKeywords(keywords), count)
  }

  /**
   * Download image → base64
   */
  private async _downloadAsBase64(url: string): Promise<string | null> {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to download image")

      const blob = await res.blob()

      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  /**
   * Store image URL in IndexedDB (without downloading yet)
   */
  private async _storeImageUrlToIndexedDB({
    imageUrl,
    source,
  }: {
    imageUrl: string
    source: string
  }): Promise<string | null> {
    try {
      const db = await openImageDB()
      const tx = db.transaction("images", "readwrite")
      const store = tx.objectStore("images")

      const id = `${source}_${Date.now()}_${Math.random().toString(36).substring(7)}`

      const imageObject: StoredImage = {
        id,
        src: imageUrl, // Store URL initially
        source,
        fetchedAt: Date.now(),
        downloaded: false, // Mark as not downloaded yet
        originalUrl: imageUrl,
      }

      store.put(imageObject)

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(id)
        tx.onerror = () => reject(new Error("Failed to store image"))
      })
    } catch {
      return null
    }
  }

  /**
   * Download and update an image that was stored as URL only
   */
  private async _downloadAndUpdateImage(imageId: string): Promise<boolean> {
    const MAX_DOWNLOAD_ATTEMPTS = 5

    try {
      // Get the image from IndexedDB
      const image = await this._getImageById(imageId)

      if (!image || image.downloaded || image.downloadFailed) {
        return true // Already downloaded, doesn't exist, or permanently failed
      }

      const attempts = (image.downloadAttempts || 0) + 1

      // Download the image
      const base64 = await this._downloadAsBase64(
        image.originalUrl || image.src,
      )

      // Update in IndexedDB
      const db = await openImageDB()
      const tx = db.transaction("images", "readwrite")
      const store = tx.objectStore("images")

      const updatedImage: StoredImage = base64
        ? {
            // Successfully downloaded
            ...image,
            src: base64,
            downloaded: true,
            downloadAttempts: attempts,
          }
        : {
            // Download failed
            ...image,
            downloadAttempts: attempts,
            downloadFailed: attempts >= MAX_DOWNLOAD_ATTEMPTS,
          }

      store.put(updatedImage)

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(!!base64)
        tx.onerror = () => reject(new Error("Failed to update image"))
      })
    } catch (error) {
      console.error("Error downloading image:", error)

      return false
    }
  }

  /**
   * Get a single image by ID
   */
  private async _getImageById(imageId: string): Promise<StoredImage | null> {
    try {
      const db = await openImageDB()
      const tx = db.transaction("images", "readonly")
      const store = tx.objectStore("images")
      const getRequest = store.get(imageId)

      return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result || null)
        getRequest.onerror = () => reject(new Error("Failed to get image"))
      })
    } catch {
      return null
    }
  }

  /**
   * Read all stored images
   */
  private async _getAllStoredImages(): Promise<StoredImage[]> {
    try {
      const db = await openImageDB()
      const tx = db.transaction("images", "readonly")
      const store = tx.objectStore("images")

      const getAll = store.getAll()

      return new Promise((resolve, reject) => {
        getAll.onsuccess = () => resolve(getAll.result as StoredImage[])
        getAll.onerror = () => reject(new Error("Failed to get images"))
      })
    } catch {
      return []
    }
  }

  /**
   * Delete all online images for a source
   */
  private async _deleteOldImages(source: string): Promise<void> {
    try {
      const db = await openImageDB()
      const tx = db.transaction("images", "readwrite")
      const store = tx.objectStore("images")
      const getAllReq = store.getAll()

      return new Promise((resolve, reject) => {
        getAllReq.onsuccess = () => {
          const allImages = getAllReq.result as StoredImage[]
          const toDelete = allImages.filter((img) => img.source === source)

          if (toDelete.length === 0) return resolve()

          let deleted = 0

          toDelete.forEach((img) => {
            const delReq = store.delete(img.id)

            delReq.onsuccess = () => {
              deleted++
              if (deleted === toDelete.length) resolve()
            }

            delReq.onerror = () =>
              reject(new Error(`Failed to delete ${img.id}`))
          })
        }

        getAllReq.onerror = () =>
          reject(new Error("Failed to get images from IndexedDB"))
      })
    } catch (error) {
      console.error("Failed to delete old images:", error)
    }
  }

  /**
   * Store multiple image URLs (without downloading yet)
   */
  private async _storeImageUrls(
    images: { imageUrl: string; source: string }[],
  ) {
    const ids: string[] = []

    for (const img of images) {
      try {
        const id = await this._storeImageUrlToIndexedDB(img)
        if (id) ids.push(id)
      } catch (e) {
        console.error("Error storing image URL", e)
      }
    }

    return ids
  }

  /**
   * Download pending images in the background
   */
  public async downloadPendingImages() {
    try {
      const allImages = await this._getAllStoredImages()
      const pendingImages = allImages.filter(
        (img) =>
          !img.downloaded && !img.downloadFailed && img.source !== "local",
      )

      if (pendingImages.length === 0) {
        console.log("No pending images to download")

        return
      }

      console.log(`Downloading ${pendingImages.length} pending images...`)

      // Download images one by one to avoid overwhelming the system
      for (const image of pendingImages) {
        try {
          await this._downloadAndUpdateImage(image.id)
          // Small delay between downloads to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Failed to download image ${image.id}:`, error)
        }
      }

      console.log("Finished downloading pending images")
    } catch (error) {
      console.error("Error in downloadPendingImages:", error)
    }
  }

  /**
   * Master method: fetch online images + replace old ones
   */
  public async fetchOnlineImages(forceFetch: boolean = false) {
    try {
      const result = await chrome.storage.sync.get("settings")
      if (!result.settings) return

      const settings = JSON.parse(result.settings)
      const { wallpapers, background } = settings

      if (!wallpapers?.onlineImages?.enabled) return
      if (background?.randomizeWallpaper === "off") return

      // skip time check when forceFetch = true
      if (!forceFetch) {
        const lf = await chrome.storage.local.get([
          LAST_ONLINE_IMAGES_FETCHED_AT,
        ])
        const last = lf[LAST_ONLINE_IMAGES_FETCHED_AT]

        if (last && Date.now() - Number(last) < 60 * 60 * 1000) {
          console.log("Not time yet")

          return
        }

        // require Chrome to be active
        const tabs = await chrome.tabs.query({ active: true })
        if (tabs.length === 0) return
      }

      const extensionName = this._activeExtensionName

      // fetch API images
      const images = await this._fetchImagesFromExtension(
        extensionName,
        wallpapers.onlineImages.keywords || "",
        20,
      )

      if (images.length === 0) {
        console.log("No images fetched")

        return
      }

      // remove old online images
      await this._deleteOldImages(extensionName)

      // store image URLs first (without downloading)
      const ids = await this._storeImageUrls(
        images.map((url) => ({
          imageUrl: url,
          source: extensionName,
        })),
      )

      if (ids.length === 0) return

      // preserve local uploaded images
      const all = await this._getAllStoredImages()
      const localIds = all
        .filter((img) => img.source === "local")
        .map((img) => img.id)

      const updatedSettings = {
        ...settings,
        wallpapers: {
          ...settings.wallpapers,
          images: [...localIds, ...ids],
        },
      }

      await chrome.storage.sync.set({
        settings: JSON.stringify(updatedSettings),
      })

      await chrome.storage.local.set({
        [LAST_ONLINE_IMAGES_FETCHED_AT]: Date.now().toString(),
      })

      console.log(`Stored ${ids.length} new online image URLs`)

      // Start downloading images in the background
      // This will continue even if the user refreshes the page
      this.downloadPendingImages().catch((error) => {
        console.error("Background download error:", error)
      })
    } catch (error) {
      console.error(error)
    }
  }
}

export const wallpaper = new Wallpaper()
