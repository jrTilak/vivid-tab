import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys"
import { Pixabay } from "./extensions/pixabay"

/**
 * What IndexedDB actually stores
 */
export interface StoredImage {
  id: string
  src: string // base64 dataURL
  source: string // "pixabay" | "local"
  fetchedAt: number
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

  constructor() {
    this._addExtension(new Pixabay())
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
   * Store one image in IndexedDB
   */
  private async _storeImageToIndexedDB({
    imageUrl,
    source,
  }: {
    imageUrl: string
    source: string
  }): Promise<string | null> {
    const base64 = await this._downloadAsBase64(imageUrl)
    if (!base64) return null

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
        const tx = db.transaction("images", "readwrite")
        const store = tx.objectStore("images")

        const id = `${source}_${Date.now()}`

        const imageObject: StoredImage = {
          id,
          src: base64,
          source,
          fetchedAt: Date.now(),
        }

        store.put(imageObject)

        tx.oncomplete = () => resolve(id)
        tx.onerror = () => reject(new Error("Failed to store image"))
      }

      request.onerror = () => reject(new Error("Failed to open IndexedDB"))
    })
  }

  /**
   * Read all stored images
   */
  private async _getAllStoredImages(): Promise<StoredImage[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ImageDB", 1)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const tx = db.transaction("images", "readonly")
        const store = tx.objectStore("images")

        const getAll = store.getAll()
        getAll.onsuccess = () => resolve(getAll.result as StoredImage[])
        getAll.onerror = () => reject(new Error("Failed to get images"))
      }

      request.onerror = () => reject(new Error("Failed to open DB"))
    })
  }

  /**
   * Delete all online images for a source
   */
  private async _deleteOldImages(source: string): Promise<void> {
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

        if (!db) resolve()

        const tx = db.transaction("images", "readwrite")

        if (!tx) resolve()

        const store = tx.objectStore("images")

        const getAllReq = store.getAll()

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
      }

      request.onerror = () => reject(new Error("Failed to open IndexedDB"))
    })
  }

  /**
   * Store multiple images
   */
  private async _storeImages(images: { imageUrl: string; source: string }[]) {
    const ids: string[] = []

    for (const img of images) {
      try {
        const id = await this._storeImageToIndexedDB(img)
        if (id) ids.push(id)
      } catch (e) {
        console.error("Error storing image", e)
      }
    }

    return ids
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

      const extensionName = "pixabay"

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

      // store new ones
      const ids = await this._storeImages(
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

      console.log(`Stored ${ids.length} new online images`)
    } catch (error) {
      console.error(error)
    }
  }
}

export const wallpaper = new Wallpaper()
