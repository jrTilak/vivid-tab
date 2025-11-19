import { type StoredImage } from "@/lib/wallpapers"
import { useEffect, useState, useRef } from "react"

/**
 * Retrieves an image from IndexedDB using its ID
 * Params: imageId (string | null) - ID of the image to retrieve
 * Returns: object with image data including source metadata
 */
const useImage = (imageId: string | null) => {
  const [imageData, setImageData] = useState<StoredImage | null>(null)
  // Track if we've already triggered download for this image to prevent infinite loops
  const downloadTriggered = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!imageId) {
      setImageData(null)

      return
    }

    const request = indexedDB.open("ImageDB", 1)

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction("images", "readonly")
      const store = transaction.objectStore("images")
      const getRequest = store.get(imageId)

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const result = getRequest.result as StoredImage
          setImageData(result)

          // If the image is not yet downloaded, trigger background download
          // Only trigger once per image to prevent infinite loops
          if (!result.downloaded && result.source !== "local" && !downloadTriggered.current.has(imageId)) {
            downloadTriggered.current.add(imageId)
            // Import wallpaper dynamically to avoid circular dependencies
            import("@/lib/wallpapers").then(({ wallpaper }) => {
              wallpaper.downloadPendingImages().catch(console.error)
            })
          }
        } else {
          console.warn("No image found with ID:", imageId)
          setImageData(null)
        }
      }

      getRequest.onerror = () => {
        console.error("Error retrieving image from IndexedDB")
        setImageData(null)
      }
    }

    request.onerror = () => {
      console.error("Failed to open IndexedDB")
      setImageData(null)
    }
  }, [imageId]) // Runs when imageId changes

  return imageData
}

export { useImage }
