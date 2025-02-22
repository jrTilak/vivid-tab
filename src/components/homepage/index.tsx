import Searchbar from "@/components/searchbars"
import useImage from "@/hooks/use-image"
import { useSettings } from "@/providers/settings-provider"
import background from "data-base64:@/assets/scene.jpg"
import { useEffect, useMemo, useState } from "react"

import Clock from "./clock"
import Notes from "./notes"
import Quote from "./quote"
import Todos from "./todos"
import Weather from "./weather"
import { Bookmarks } from "./bookmarks"
import { cn } from "@/lib/cn"

type Layout = "small" | "mid" | "large"

export default function Homepage() {
  const [layoutType, setLayoutType] = useState<Layout>("small")
  const {
    settings: { layout, wallpapers, general: { bookmarksCanTakeExtraSpaceIfAvailable } },
  } = useSettings()

  const image = useImage(wallpapers.selectedImageId)

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

    console.log("called")

    // case 1: three cols are present
    if ((layout[1] || layout[2] || layout[3]) && (layout[5] || layout[6] || layout[7])) {
      setLayoutType("small")
    }
    // case 2: only two col is present (left and middle or right and middle)
    else if ((layout[1] || layout[2] || layout[3]) || (layout[5] || layout[6] || layout[7])) {
      setLayoutType("mid")
    }
    // case 3: only one col is present
    else {
      setLayoutType("large")
    }
  }, [bookmarksCanTakeExtraSpaceIfAvailable, layout])

  useEffect(() => {
    console.log(layoutType)
  }, [layoutType])

  return (
    <div className="min-h-screen w-full bg-cover bg-center p-6 relative select-none">
      <img
        src={wallpapers.selectedImageId === null ? background : image}
        alt="scene"
        className="h-full w-full object-cover object-center absolute inset-0"
      />
      <div className="h-full w-full absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      <div className="mx-auto max-w-[1400px] relative mt-20">
        {/* Tabs */}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-x-14">
          {/* Left Sidebar */}
          {(layout[1] || layout[2] || layout[3]) &&

            <div className="col-span-3 space-y-6 max-xl:hidden">
              {layout[1] && COMPONENTS[layout[1]]}
              {layout[2] && COMPONENTS[layout[2]]}
              {layout[3] && COMPONENTS[layout[3]]}
            </div>
          }

          {/* to align to center */}
          {
            layoutType === "large" && <div className="col-span-1" />
          }

          <div className={cn("flex flex-col col-span-6",
            layoutType === "mid" ? "col-span-8" : layoutType === "large" ? "col-span-10" : "col-span-6"
          )}>
            {layout[0] && <div className="mb-6 flex items-center justify-center mx-auto w-full">
              {COMPONENTS[layout[0]]}
            </div>}
            {layout[4] && COMPONENTS[layout[4]]}
            {layout[8] && <div className="mt-6 flex items-center justify-center mx-auto w-full">
              {COMPONENTS[layout[8]]}
            </div>}
          </div>

          {/* Right Sidebar */}
          {(layout[5] || layout[6] || layout[7]) && <div className="col-span-3 space-y-6  max-xl:hidden">
            {layout[5] && COMPONENTS[layout[5]]}
            {layout[6] && COMPONENTS[layout[6]]}
            {layout[7] && COMPONENTS[layout[7]]}
          </div>}
        </div>
      </div>
    </div>
  )
}
