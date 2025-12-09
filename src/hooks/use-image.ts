import { type StoredImage } from "@/lib/wallpapers"
import { openImageDB } from "@/lib/db/indexeddb"
import { useEffect, useState } from "react"

/**
 * Retrieves an image from IndexedDB using its ID
 * Params: imageId (string | null) - ID of the image to retrieve
 * Returns: object with image data including source metadata
 */
const useImage = (imageId: string | null) => {
  const [imageData, setImageData] = useState<StoredImage | null>(null)

  useEffect(() => {
    if (!imageId) {
      setImageData(null)

      return
    }

    openImageDB()
      .then((db) => {
        const transaction = db.transaction("images", "readonly")
        const store = transaction.objectStore("images")
        const getRequest = store.get(imageId)

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const result = getRequest.result as StoredImage
            setImageData(result)

            // If the image is not yet downloaded, trigger background download
            if (!result.downloaded && result.source !== "local") {
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
      })
      .catch(() => {
        console.error("Failed to open IndexedDB")
        setImageData(null)
      })
  }, [imageId]) // Runs when imageId changes

  return imageData
}

export { useImage }
