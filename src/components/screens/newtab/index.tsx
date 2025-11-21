import { useSettings } from "@/providers/settings-provider"
import background from "data-base64:@/assets/scene.jpg"
import { useEffect, useMemo, useState } from "react"
import { Clock } from "./widgets/clock"
import { Notes } from "./widgets/notes"
import { Quote } from "./widgets/quote"
import { Todos } from "./widgets/todos"
import { Weather } from "./widgets/weather"
import { cn } from "@/lib/cn"
import { Searchbar } from "./widgets/searchbar"
import { useWallpaper } from "@/hooks/use-wallpaper"
import { Bookmarks } from "./widgets/bookmarks"
import { NextWallpaperButton } from "./next-wallpaper-button"

type Layout = "small" | "mid" | "large"

export default function Homepage() {
  const [layoutType, setLayoutType] = useState<Layout>("small")
  const [imageLoadError, setImageLoadError] = useState(false)
  const {
    settings: {
      layout,
      wallpapers,
      general: { bookmarksCanTakeExtraSpaceIfAvailable },
      background: backgroundSettings,
    },
  } = useSettings()

  const imageData = useWallpaper()

  // Reset error state when imageData changes
  useEffect(() => {
    setImageLoadError(false)
  }, [imageData?.src])

  const COMPONENTS = useMemo(() => {
    return {
      searchbar: <Searchbar />,
      clock: <Clock />,
      weather: <Weather />,
      todos: <Todos />,
      bookmarks: <Bookmarks />,
      quotes: <Quote />,
      notes: <Notes />,
    }
  }, [])

  useEffect(() => {
    if (!bookmarksCanTakeExtraSpaceIfAvailable) {
      setLayoutType("small")

      return
    }

    // case 1: three cols are present
    if (
      (layout[1] || layout[2] || layout[3]) &&
      (layout[5] || layout[6] || layout[7])
    ) {
      setLayoutType("small")
    }
    // case 2: only two col is present (left and middle or right and middle)
    else if (
      layout[1] ||
      layout[2] ||
      layout[3] ||
      layout[5] ||
      layout[6] ||
      layout[7]
    ) {
      setLayoutType("mid")
    }
    // case 3: only one col is present
    else {
      setLayoutType("large")
    }
  }, [bookmarksCanTakeExtraSpaceIfAvailable, layout])

  // Determine which background to use
  const backgroundToUse =
    !wallpapers.selectedImageId || imageLoadError
      ? background
      : imageData?.src || background

  return (
    <>
      <div className="min-h-screen w-full bg-cover bg-center p-6 relative select-none transition-all">
        {/* Hidden img element to detect load errors */}
        {wallpapers.selectedImageId && imageData?.src && !imageLoadError && (
          <img
            src={imageData.src}
            alt=""
            onError={() => setImageLoadError(true)}
            className="hidden"
          />
        )}
        <div
          style={{
            backgroundImage: `url(${backgroundToUse})`,
          }}
          className={cn(
            "h-full w-full bg-cover bg-center bg-no-repeat absolute inset-0",
          )}
        />
        <div
          style={{
            backdropFilter: `blur(${backgroundSettings.blurIntensity}px)`,
            backgroundColor: `rgba(0, 0, 0, ${1 - backgroundSettings.brightness / 10})`,
          }}
          className={cn(`h-full w-full absolute inset-0`)}
        />

        <div className="mx-auto max-w-[1500px] relative mt-20">
          {/* Tabs */}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-14">
            {/* Left Sidebar */}
            {(layout[1] || layout[2] || layout[3]) && (
              <div className="col-span-3 space-y-6 max-xl:hidden">
                {layout[1] && COMPONENTS[layout[1]]}
                {layout[2] && COMPONENTS[layout[2]]}
                {layout[3] && COMPONENTS[layout[3]]}
              </div>
            )}

            {/* to align to center */}
            {layoutType === "small" &&
              !(layout[1] || layout[2] || layout[3]) &&
              !(layout[5] || layout[6] || layout[7]) && (
                <div className="col-span-3" />
              )}
            {layoutType === "large" && <div className="col-span-1" />}

            <div
              className={cn(
                "flex flex-col col-span-6",
                layoutType === "mid"
                  ? "col-span-8"
                  : layoutType === "large"
                    ? "col-span-10"
                    : "col-span-6",
              )}
            >
              {layout[0] && (
                <div className="mb-6 flex items-center justify-center mx-auto w-full">
                  {COMPONENTS[layout[0]]}
                </div>
              )}
              {layout[4] && COMPONENTS[layout[4]]}
              {layout[8] && (
                <div className="mt-6 flex items-center justify-center mx-auto w-full">
                  {COMPONENTS[layout[8]]}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            {(layout[5] || layout[6] || layout[7]) && (
              <div className="col-span-3 space-y-6  max-xl:hidden">
                {layout[5] && COMPONENTS[layout[5]]}
                {layout[6] && COMPONENTS[layout[6]]}
                {layout[7] && COMPONENTS[layout[7]]}
              </div>
            )}
          </div>
        </div>

        {/* Image Credits */}
        {imageData?.source && imageData?.source !== "local" && (
          <div className="fixed bottom-4 left-4 z-50">
            <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              Images powered by {imageData?.source}
            </div>
          </div>
        )}

        {/* Next Wallpaper Button */}
        <NextWallpaperButton />
      </div>
    </>
  )
}
