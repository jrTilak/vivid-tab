import { useEffect, useState } from "react"

interface ImageData {
  src: string
  source?: "local" | "pixabay"
  pixabayId?: number
  tags?: string
  user?: string
  fetchedAt?: number
}

/**
 * Retrieves an image from IndexedDB using its ID
 * Params: imageId (string | null) - ID of the image to retrieve
 * Returns: object with image data including source metadata
 */
const useImage = (imageId: string | null) => {
  const [imageData, setImageData] = useState<ImageData | null>(null)

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
          setImageData({
            src: getRequest.result.src,
            source: getRequest.result.source || "local",
            pixabayId: getRequest.result.pixabayId,
            tags: getRequest.result.tags,
            user: getRequest.result.user,
            fetchedAt: getRequest.result.fetchedAt,
          })
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
