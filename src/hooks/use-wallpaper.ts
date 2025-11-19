import { useSettings } from "@/providers/settings-provider"
import { useEffect, useRef } from "react"
import { useImage } from "./use-image"
import { randomInt } from "@/lib/random"
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys"

export const useWallpaper = () => {
  const {
    settings: { wallpapers, background },
    setSettings,
  } = useSettings()
  
  // Track if we've already run the effect for "on-each-tab" mode
  const hasRunOnMount = useRef(false)
  
  useEffect(() => {
    // For "on-each-tab" mode, only run once on mount
    if (background.randomizeWallpaper === "on-each-tab" && hasRunOnMount.current) {
      return
    }
    
    const newImage = () => {
      if (wallpapers.images.length === 0) return wallpapers.selectedImageId

      const currentImageIndex = wallpapers.images.indexOf(wallpapers.selectedImageId)

      // generating from 0 - length ie one more than acutal images so that we can also show the default wallpaper at last index
      return wallpapers.images[
        randomInt(0, wallpapers.images.length, [currentImageIndex])
      ]
    }

    switch (background.randomizeWallpaper) {
      case "off":
        // do nothing - keep current selectedImageId
        break
      case "on-each-tab":
        if (wallpapers.images.length > 0) {
          const selectedImageId = newImage()
          setSettings((prev) => ({
            ...prev,
            wallpapers: {
              ...prev.wallpapers,
              selectedImageId: selectedImageId,
            },
          }))
          hasRunOnMount.current = true
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
  }, [background.randomizeWallpaper, wallpapers.images.length])

  const imageData = useImage(wallpapers.selectedImageId)

  return imageData
}
