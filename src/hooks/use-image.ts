import { useEffect, useState } from "react"

const useImage = (imageId: string | null) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!imageId) return

    const request = indexedDB.open("ImageDB", 1)

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction("images", "readonly")
      const store = transaction.objectStore("images")
      const getRequest = store.get(imageId)

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          setImageSrc(getRequest.result.src)
        } else {
          console.warn("No image found with ID:", imageId)
        }
      }

      getRequest.onerror = () => {
        console.error("Error retrieving image from IndexedDB")
      }
    }

    request.onerror = () => {
      console.error("Failed to open IndexedDB")
    }
  }, [imageId]) // Runs when imageId changes

  return imageSrc
}

export default useImage
