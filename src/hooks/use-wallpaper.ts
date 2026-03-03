import { useSettings } from "@/providers/settings-provider"
import { useEffect } from "react"
import { useImage } from "./use-image"
import { randomInt } from "@/lib/random"
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys"

export const useWallpaper = () => {
  const {
    settings: { wallpapers, background },
    setSettings,
  } = useSettings()
  useEffect(() => {
    let selectedImageId = wallpapers.selectedImageId
    let shouldUpdateSettings = false

    const newImage = (): string | null => {
      if (wallpapers.images.length === 0) return selectedImageId ?? null

      const currentImageIndex = wallpapers.images.indexOf(
        selectedImageId ?? undefined,
      )
      const maxIndex = wallpapers.images.length - 1
      const excludeIndices = currentImageIndex >= 0 ? [currentImageIndex] : []
      const idx = randomInt(0, maxIndex < 0 ? 0 : maxIndex, excludeIndices)

      return wallpapers.images[idx] ?? wallpapers.images[0] ?? null
    }

    switch (background.randomizeWallpaper) {
      case "off":
        // do nothing - keep current selectedImageId
        break
      case "on-each-tab":
        if (wallpapers.images.length > 0) {
          selectedImageId = newImage()
          shouldUpdateSettings = true
        }

        break
      case "hourly":
        chrome.storage.local.get([LAST_WALLPAPER_CHANGED_AT], (result) => {
          const lastWallpaperChangedAt = result[LAST_WALLPAPER_CHANGED_AT]

          if (wallpapers.images.length > 0) {
            if (!lastWallpaperChangedAt) {
              // First time - set a random wallpaper and timestamp
              const newSelectedImageId = newImage()

              setSettings((prev) => ({
                ...prev,
                wallpapers: {
                  ...prev.wallpapers,
                  selectedImageId: newSelectedImageId,
                },
              }))

              chrome.storage.local.set({
                [LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
              })
            } else {
              const lastWallpaperChangedAtDate = new Date(
                lastWallpaperChangedAt,
              )
              const now = new Date()
              const diff = now.getTime() - lastWallpaperChangedAtDate.getTime()
              const diffInHours = diff / (1000 * 60 * 60)

              if (diffInHours >= 1) {
                const newSelectedImageId = newImage()

                setSettings((prev) => ({
                  ...prev,
                  wallpapers: {
                    ...prev.wallpapers,
                    selectedImageId: newSelectedImageId,
                  },
                }))

                chrome.storage.local.set({
                  [LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
                })
              }
            }
          }
        })
        break
      case "daily":
        chrome.storage.local.get([LAST_WALLPAPER_CHANGED_AT], (result) => {
          const lastWallpaperChangedAt = result[LAST_WALLPAPER_CHANGED_AT]

          if (wallpapers.images.length > 0) {
            if (!lastWallpaperChangedAt) {
              // First time - set a random wallpaper and timestamp
              const newSelectedImageId = newImage()

              setSettings((prev) => ({
                ...prev,
                wallpapers: {
                  ...prev.wallpapers,
                  selectedImageId: newSelectedImageId,
                },
              }))

              chrome.storage.local.set({
                [LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
              })
            } else {
              const lastWallpaperChangedAtDate = new Date(
                lastWallpaperChangedAt,
              )
              const now = new Date()
              const diff = now.getTime() - lastWallpaperChangedAtDate.getTime()
              const diffInHours = diff / (1000 * 60 * 60)

              if (diffInHours >= 24) {
                const newSelectedImageId = newImage()

                setSettings((prev) => ({
                  ...prev,
                  wallpapers: {
                    ...prev.wallpapers,
                    selectedImageId: newSelectedImageId,
                  },
                }))

                chrome.storage.local.set({
                  [LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
                })
              }
            }
          }
        })
        break
      default:
        break
    }

    // Only update settings for "on-each-tab" case synchronously
    if (shouldUpdateSettings) {
      setSettings((prev) => ({
        ...prev,
        wallpapers: {
          ...prev.wallpapers,
          selectedImageId: selectedImageId,
        },
      }))
    }
  }, [background.randomizeWallpaper])

  const imageData = useImage(wallpapers.selectedImageId)

  return imageData
}
