import Searchbar1 from "@/components/searchbars/1"
import { useSettings } from "@/providers/settings-provider"
import background from "data-base64:@/assets/scene.jpg"
import * as React from "react"

import type { ImageData } from "../settings/tabs/wallpapers"
import Bookmarks from "./bookmarks"
import Clock from "./clock"
import Notes from "./notes"
import Quote from "./quote"
import Todos from "./todos"
import Weather from "./weather"

export default function Homepage() {
  const [image, setImage] = React.useState<ImageData>(null)
  const {
    settings: { layout }
  } = useSettings()

  // get images from local storage
  React.useEffect(() => {
    chrome.storage.local.get("selectedImage", (data) => {
      if (data.selectedImage) {
        try {
          setImage(JSON.parse(data.selectedImage))
        } catch (error) {
          console.error("Error parsing images from local storage", error)
          setImage({
            src: background
          })
        }
      }
    })
  }, [])

  const COMPONENTS = React.useMemo(() => {
    return {
      searchbar: <Searchbar1 />,
      clock: <Clock />,
      weather: <Weather />,
      todos: <Todos />,
      bookmarks: <Bookmarks />,
      quotes: <Quote />,
      notes: <Notes />
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-cover bg-center p-6 relative">
      <img
        src={image?.src}
        alt="scene"
        className="h-full w-full object-cover object-center absolute inset-0"
      />
      <div className="h-full w-full absolute inset-0  bg-black/50 backdrop-blur-[1px]" />

      <div className="mx-auto max-w-[1400px] relative">
        {/* Search Bar */}
        <div className="mb-6 flex items-center justify-center">
          <Searchbar1 />
        </div>

        {/* Tabs */}

        <div className="grid grid-cols-12 gap-x-14">
          {/* Left Sidebar */}
          <div className="col-span-3 space-y-6 opacity-80">
            {layout[1] && COMPONENTS[layout[1]]}
            {layout[2] && COMPONENTS[layout[2]]}
            {layout[3] && COMPONENTS[layout[3]]}
          </div>

          {/* Main Content */ layout[4] && COMPONENTS[layout[4]]}

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6 opacity-80">
            {layout[5] && COMPONENTS[layout[5]]}
            {layout[6] && COMPONENTS[layout[6]]}
            {layout[7] && COMPONENTS[layout[7]]}
          </div>
        </div>
      </div>
    </div>
  )
}
