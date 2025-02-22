import { useSettings } from "@/providers/settings-provider"
import { useCallback } from "react"

import ImageCard from "./components/image-card"
import UploadButton from "./components/upload-button"

export interface ImageData {
  src: string
}

export default function WallpaperSettings() {
  const {
    settings: {
      wallpapers: { selectedImageId, images },
    },
    setSettings,
  } = useSettings()

  const handleImageSelect = useCallback((id: string | null) => {
    setSettings((prev) => ({
      ...prev,
      wallpapers: {
        ...prev.wallpapers,
        selectedImageId: id,
      },
    }))
  }, [])

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader()

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const imageSrc = e.target?.result as string // Explicitly cast e.target as FileReader
      const imageId = String(Date.now()) // Generate a unique ID

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

        const imageObject = { id: imageId, src: imageSrc }

        store.put(imageObject)
        console.log("Image stored with ID:", imageId)

        setSettings((prev) => ({
          ...prev,
          wallpapers: {
            ...prev.wallpapers,
            images: [...prev.wallpapers.images, imageId],
          },
        }))
      }

      request.onerror = () => {
        console.error("IndexedDB error: Failed to open database")
      }
    }

    reader.readAsDataURL(file)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        <UploadButton onUpload={handleImageUpload} />

        {[null, ...images].map((image, i) => (
          <ImageCard
            key={i}
            imageId={image}
            isSelected={image === selectedImageId}
            onSelect={() => handleImageSelect(image)}
          />
        ))}
      </div>
    </div>
  )
}
