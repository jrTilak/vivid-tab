import { useSettings } from "@/providers/settings-provider"
import { useCallback, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { RefreshCwIcon } from "lucide-react"
import { pixabay } from "@/lib/pixabay"
import { LAST_ONLINE_IMAGES_FETCHED_AT } from "@/constants/keys"

import ImageCard from "./components/image-card"
import UploadButton from "./components/upload-button"

export interface ImageData {
  src: string
}

export default function WallpaperSettings() {
  const {
    settings: {
      wallpapers: { selectedImageId, images, onlineImages },
    },
    setSettings,
  } = useSettings()
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const handleOnlineImagesChange = useCallback(
    (key: "enabled" | "keywords", value: boolean | string) => {
      setSettings((prev) => ({
        ...prev,
        wallpapers: {
          ...prev.wallpapers,
          onlineImages: {
            ...prev.wallpapers.onlineImages,
            [key]: value,
          },
        },
      }))
    },
    [setSettings],
  )

  const forceRefreshImages = useCallback(async () => {
    if (!onlineImages.enabled || isRefreshing) {
      return
    }

    setIsRefreshing(true)

    try {
      console.log("Force fetching new images from Pixabay...")

      // Fetch images from Pixabay
      const images = await pixabay.fetchImages(onlineImages.keywords || "", 10)

      if (images.length === 0) {
        console.log("No images fetched from Pixabay")

        return
      }

      // Store images using the new method that replaces old online images
      // while preserving local uploads
      const imageIds = await pixabay.storePixabayImages(images)

      if (imageIds.length > 0) {
        // Get all stored images to filter local ones
        const allStoredImages = await pixabay.getAllStoredImages()
        const localImageIds = allStoredImages
          .filter((img) => img.source === "local")
          .map((img) => img.id)

        // Update settings with new online image IDs plus existing local ones
        setSettings((prev) => ({
          ...prev,
          wallpapers: {
            ...prev.wallpapers,
            images: [...localImageIds, ...imageIds],
          },
        }))

        // Update last fetch time
        await chrome.storage.local.set({
          [LAST_ONLINE_IMAGES_FETCHED_AT]: Date.now().toString(),
        })

        console.log(
          `Successfully fetched and stored ${imageIds.length} images from Pixabay`,
        )
      }
    } catch (error) {
      console.error("Error in forceRefreshImages:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onlineImages.enabled, onlineImages.keywords, isRefreshing, setSettings])

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Online Images Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="online-images-toggle"
              className="text-sm font-medium"
            >
              Get images from online
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically fetch images from Pixabay
            </p>
          </div>
          <Switch
            id="online-images-toggle"
            checked={onlineImages.enabled}
            onCheckedChange={(checked) =>
              handleOnlineImagesChange("enabled", checked)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords-input" className="text-sm font-medium">
            Image keywords you like (comma-separated)
          </Label>
          <Input
            id="keywords-input"
            placeholder="nature, mountains, ocean, sunset"
            value={onlineImages.keywords}
            onChange={(e) =>
              handleOnlineImagesChange("keywords", e.target.value)
            }
            disabled={!onlineImages.enabled}
          />
          <p className="text-xs text-muted-foreground">
            Enter keywords to find relevant background images
          </p>
        </div>
      </div>

      <Separator />

      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Wallpaper Gallery</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={forceRefreshImages}
            disabled={!onlineImages.enabled || isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Reload"}
          </Button>
        </div>
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
    </div>
  )
}
