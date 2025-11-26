import { useNextWallpaper } from "@/hooks/use-next-wallpaper"
import { SkipForward } from "lucide-react"
import { cn } from "@/lib/cn"

export const NextWallpaperButton = () => {
  const { nextWallpaper, hasWallpapers } = useNextWallpaper()

  // Don't render if no wallpapers available
  if (!hasWallpapers) return null

  return (
    <button
      onClick={nextWallpaper}
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "bg-white/10 backdrop-blur-md",
        "hover:bg-white/20",
        "text-white",
        "p-3 rounded-full",
        "transition-all duration-200",
        "shadow-lg hover:shadow-xl",
        "cursor-pointer disabled:cursor-default"
      )}
      aria-label="Next wallpaper"
      title="Next wallpaper"
    >
      <SkipForward className="w-5 h-5" />
    </button>
  )
}
