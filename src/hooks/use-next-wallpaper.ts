import { useSettings } from "@/providers/settings-provider"
import { randomInt } from "@/lib/random"
import { LAST_WALLPAPER_CHANGED_AT } from "@/constants/keys"

/**
 * Hook to manage next wallpaper functionality
 */
export const useNextWallpaper = () => {
  const {
    settings: { wallpapers },
    setSettings,
  } = useSettings()

  const nextWallpaper = () => {
    if (wallpapers.images.length === 0) return

    const currentImageIndex = wallpapers.images.indexOf(
      wallpapers.selectedImageId,
    )

    // Get a random wallpaper, excluding the current one (if found)
    const excludeIndices = currentImageIndex >= 0 ? [currentImageIndex] : []
    const newImageId =
      wallpapers.images[randomInt(0, wallpapers.images.length, excludeIndices)]

    // Update settings with new wallpaper
    setSettings((prev) => ({
      ...prev,
      wallpapers: {
        ...prev.wallpapers,
        selectedImageId: newImageId,
      },
    }))

    // Update last changed timestamp
    chrome.storage.local.set({
      [LAST_WALLPAPER_CHANGED_AT]: Date.now().toString(),
    })
  }

  return {
    nextWallpaper,
    hasWallpapers: wallpapers.images.length > 0,
  }
}
