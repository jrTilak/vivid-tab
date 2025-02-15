import Searchbar from "@/components/searchbars"
import useImage from "@/hooks/use-image"
import { useSettings } from "@/providers/settings-provider"
import background from "data-base64:@/assets/scene.jpg"
import { useMemo } from "react"

import Bookmarks from "./bookmarks"
import Clock from "./clock"
import Notes from "./notes"
import Quote from "./quote"
import Todos from "./todos"
import Weather from "./weather"

export default function Homepage() {
  const {
    settings: { layout, wallpapers }
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
      notes: <Notes />
    }
  }, [])

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
          <div className="col-span-3 space-y-6 max-xl:hidden">
            {layout[1] && COMPONENTS[layout[1]]}
            {layout[2] && COMPONENTS[layout[2]]}
            {layout[3] && COMPONENTS[layout[3]]}
          </div>

          <div className="flex flex-col col-span-6">
            <div className="mb-6 flex items-center justify-center mx-auto w-full">
              <Searchbar />
            </div>
            {layout[4] && COMPONENTS[layout[4]]}
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6  max-xl:hidden">
            {layout[5] && COMPONENTS[layout[5]]}
            {layout[6] && COMPONENTS[layout[6]]}
            {layout[7] && COMPONENTS[layout[7]]}
          </div>
        </div>
      </div>
    </div>
  )
}
