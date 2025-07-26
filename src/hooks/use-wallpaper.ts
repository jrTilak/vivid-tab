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

    switch (background.randomizeWallpaper) {
      case "off":
        // do nothing
        break
      case "on-each-tab":
        selectedImageId =
          wallpapers.images[randomInt(0, wallpapers.images.length)]
        break
      case "hourly":
        chrome.storage.local.get([LAST_WALLPAPER_CHANGED_AT], (result) => {
          const lastWallpaperChangedAt = result[LAST_WALLPAPER_CHANGED_AT]

          if (lastWallpaperChangedAt) {
            const lastWallpaperChangedAtDate = new Date(lastWallpaperChangedAt)
            const now = new Date()
            const diff = now.getTime() - lastWallpaperChangedAtDate.getTime()
            const diffInHours = diff / (1000 * 60 * 60)

            if (diffInHours >= 1) {
              selectedImageId =
                wallpapers.images[randomInt(0, wallpapers.images.length)]

              chrome.storage.local.set({
                [LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
              })
            }
          }
        })
        break
      case "daily":
        chrome.storage.local.get([LAST_WALLPAPER_CHANGED_AT], (result) => {
          const lastWallpaperChangedAt = result[LAST_WALLPAPER_CHANGED_AT]

          if (lastWallpaperChangedAt) {
            const lastWallpaperChangedAtDate = new Date(lastWallpaperChangedAt)
            const now = new Date()
            const diff = now.getTime() - lastWallpaperChangedAtDate.getTime()
            const diffInHours = diff / (1000 * 60 * 60)

            if (diffInHours >= 24) {
              selectedImageId =
                wallpapers.images[randomInt(0, wallpapers.images.length)]

              chrome.storage.local.set({
                [LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
              })
            }
          }
        })
        break
      default:
        break
    }

    console.log(selectedImageId)
    setSettings((prev) => ({
      ...prev,
      wallpapers: {
        ...prev.wallpapers,
        selectedImageId:
          wallpapers.images[randomInt(0, wallpapers.images.length)],
      },
    }))
  }, [background.randomizeWallpaper])

  const imageSrc = useImage(wallpapers.selectedImageId)

  return imageSrc
}
