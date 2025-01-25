import { useSettings } from "@/providers/settings-provider"
import React, { useMemo } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

import PreviewCard from "./preview-card"

const LayoutsSettings = () => {
  const {
    settings: { layout }
  } = useSettings()

  const COMPONENTS = useMemo(() => {
    return {
      searchbar: (
        <PreviewCard
          id="search-bar"
          label="Search Bar"
          className="h-9 mx-auto w-[80%]"
          index={0}
        />
      ),
      clock: <PreviewCard id="clock" label="Clock" index={1} />,
      weather: <PreviewCard id="weather" label="Weather" index={2} />,
      todos: <PreviewCard id="todos" label="Todos" index={3} />,
      bookmarks: (
        <PreviewCard
          id="bookmarks"
          label="Bookmarks"
          className="col-span-6"
          index={4}
        />
      ),
      quotes: <PreviewCard id="quotes" label="Quotes" index={5} />,
      notes: <PreviewCard id="notes" label="Notes" index={6} />
    }
  }, [])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-5 w-full p-4">
        <div className="relative">
          {/* Search Bar */}
          <div className="mb-6 flex items-center justify-center">
            {layout[0] && COMPONENTS[layout[0]]}
          </div>

          {/* Tabs */}

          <div className="grid grid-cols-12 gap-x-9">
            {/* Left Sidebar */}
            <div className="col-span-3 space-y-6 opacity-80">
              {layout[1] && COMPONENTS[layout[1]]}
              {layout[2] && COMPONENTS[layout[2]]}
              {layout[3] && COMPONENTS[layout[3]]}
            </div>

            {/* Main Content */}
            {layout[4] && COMPONENTS[layout[4]]}

            {/* Right Sidebar */}
            <div className="col-span-3 space-y-6 opacity-80">
              {layout[5] && COMPONENTS[layout[5]]}
              {layout[6] && COMPONENTS[layout[6]]}
              {layout[7] && COMPONENTS[layout[7]]}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            {layout[8] && COMPONENTS[layout[8]]}
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

export default LayoutsSettings
