import { useState, useCallback, useEffect } from "react"
import UploadButton from "./components/upload-button"
import ImageCard from "./components/image-card"

export interface ImageData {
  src: string
}

import { useSettings } from "@/providers/settings-provider"

export default function WallpaperSettings() {
  const [images, setImages] = useState<ImageData[]>([])
  const { settings: { wallpapers: { selectedImgIndex } }, setSettings } = useSettings()

  const handleImageSelect = useCallback((i: number) => {
    setSettings((prev) => ({
      ...prev,
      wallpapers: {
        ...prev.wallpapers,
        selectedImgIndex: i
      }
    }))

    chrome.storage.local.set({
      selectedImage: JSON.stringify(images[i])
    })
  }, [])

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const newImageSrc = e.target?.result as string
      const newImages = [...images, { src: newImageSrc }]
      setImages(newImages)
      chrome.storage.local.set({ wallpapers: JSON.stringify(newImages) })
    }
    reader.readAsDataURL(file)
  }, [])

  // get images from local storage
  useEffect(() => {
    chrome.storage.local.get("wallpapers", (data) => {
      if (data.wallpapers) {
        try {
          setImages(JSON.parse(data.wallpapers))
        } catch (error) {
          console.error("Error parsing images from local storage", error)
        }
      }
    }
    )
  }, [])

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        <UploadButton onUpload={handleImageUpload} />
        {images.map((image, i) => (
          <ImageCard
            key={i}
            image={image}
            isSelected={i === selectedImgIndex}
            onSelect={() => handleImageSelect(i)}
          />
        ))}
      </div>
    </div>
  )
}

