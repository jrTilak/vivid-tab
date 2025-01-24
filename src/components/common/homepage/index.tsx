import * as React from "react"
import Clock from "./clock"
import Weather from "./weather"
import Todos from "./todos"
import Quote from "./quote"
import Notes from "./notes"
import Bookmarks from "./bookmarks"
import Searchbar1 from "@/components/searchbars/1"
import { useSettings } from "@/providers/settings-provider"
import type { ImageData } from "../settings/tabs/wallpapers"
import background from "data-base64:@/assets/scene.jpg"


export default function Homepage() {
  const [image, setImage] = React.useState<ImageData>(null)

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

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center p-6 relative"
    >

      <img
        src={image?.src}
        alt="scene"
        className="h-full w-full object-cover object-center absolute inset-0"
      />
      <div
        className="h-full w-full absolute inset-0  bg-black/50 backdrop-blur-[1px]"
      />

      <div className="mx-auto max-w-[1400px] relative">
        {/* Search Bar */}
        <div className="mb-6 flex items-center justify-center">
          <Searchbar1 />
        </div>

        {/* Tabs */}


        <div className="grid grid-cols-12 gap-x-14">
          {/* Left Sidebar */}
          <div className="col-span-3 space-y-6 opacity-80">
            <Clock />
            <Weather />
            <Todos />
          </div>

          <Bookmarks />

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-6 opacity-80">
            <Quote />
            <Notes />
          </div>
        </div>
      </div>
    </div>
  )
}

