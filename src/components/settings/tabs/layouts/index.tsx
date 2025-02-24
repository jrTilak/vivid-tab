import { useSettings } from "@/providers/settings-provider"
import React, { useMemo } from "react"

import PreviewCard from "./preview-card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import filterObj from "@/lib/filter-obj"

const LayoutsSettings = () => {
  const {
    settings: { layout },
    setSettings,
  } = useSettings()

  const COMPONENTS = useMemo(() => {
    return {
      searchbar: (
        <PreviewCard
          id="searchbar"
          label="Search Bar"
          className="h-9 mx-auto"
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
          className="h-full"
          index={4}
        />
      ),
      quotes: <PreviewCard id="quotes" label="Quotes" index={5} />,
      notes: <PreviewCard id="notes" label="Notes" index={6} />,
    }
  }, [])

  // const onDragEnd = ({
  //   active: {
  //     id: from,
  //     data: { current: activeCurrent },
  //   },
  //   over: {
  //     id: to,
  //     data: { current },
  //   },
  // }: DragEndEvent) => {
  //   console.log(`${from} -> ${to} with index ${current.index}`)

  //   if (from === to) {
  //     console.log("Same item, returning")

  //     return
  //   }

  //   if (from === "bookmarks" || to === "bookmarks") {
  //     console.log("Bookmarks can't be moved, returning")

  //     return
  //   }

  //   if (from === "searchbar" && !(current.index === 0 || current.index === 8)) {
  //     console.log("Searchbar can only be moved to the top or bottom, returning")

  //     return
  //   }

  //   setSettings((prevSettings) => {
  //     return {
  //       ...prevSettings,
  //       layout: {
  //         ...prevSettings.layout,
  //         ...(from.toString().startsWith("empty")
  //           ? {}
  //           : { [current.index]: from }),
  //         ...(to.toString().startsWith("empty")
  //           ? {}
  //           : { [activeCurrent.index]: to }),
  //       },
  //     }
  //   })
  // }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="grid gap-4 grid-cols-4">
        {Object.keys(COMPONENTS).map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              onCheckedChange={(val) => {
                if (val) {
                  const newLayout = layout

                  if (key === "bookmarks") {
                    newLayout[4] = "bookmarks"
                  } else if (key === "searchbar") {
                    newLayout[0] = "searchbar"
                  } else {
                    const canBeUsedIndex = [1, 2, 3, 5, 6, 7]
                    const usedIndex = Object.keys(layout).map((k) => Number(k))

                    const available = canBeUsedIndex.filter(
                      (v) => !usedIndex.includes(v),
                    )

                    newLayout[available[0]] = key
                  }

                  setSettings((prev) => ({
                    ...prev,
                    layout: newLayout,
                  }))
                } else {
                  const filtered = filterObj(layout, (val) => val !== key)
                  setSettings((prev) => ({
                    ...prev,
                    layout: filtered,
                  }))
                }
              }}
              checked={Object.values(layout).includes(key)}
              id="terms"
            />
            <Label
              htmlFor="terms"
              className="text-sm capitalize text-muted-foreground"
            >
              {key}
            </Label>
          </div>
        ))}
      </div>
      <Separator />
      {/* disabling temporarily */}
      {/* <DndContext onDragEnd={onDragEnd}>
        <div className="space-y-5 w-full ">
          <p className="text-destructive text-xs">
            (Draggable doesn&apos;t work properly ⚠️)
          </p>
          <div className="relative">

            <div className="grid grid-cols-12 gap-x-9">
              <div className="col-span-3 space-y-6 opacity-80">
                {COMPONENTS[layout[1]] || <PreviewCard index={1} />}
                {COMPONENTS[layout[2]] || <PreviewCard index={2} />}
                {COMPONENTS[layout[3]] || <PreviewCard index={3} />}
              </div>

              <div className="flex flex-col col-span-6 h-full">
                <div className="mb-6 flex items-center justify-center mx-auto w-full">
                  {COMPONENTS[layout[0]] || (
                    <PreviewCard index={0} className="h-9 mx-auto " />
                  )}
                </div>
                <div className="flex-grow">{COMPONENTS[layout[4]]}</div>
                <div className="mt-6 flex items-center justify-center">
                  {COMPONENTS[layout[8]] || (
                    <PreviewCard index={8} className="h-9 mx-auto" />
                  )}
                </div>
              </div>

              <div className="col-span-3 space-y-6 opacity-80">
                {COMPONENTS[layout[5]] || <PreviewCard index={5} />}
                {COMPONENTS[layout[6]] || <PreviewCard index={6} />}
                {COMPONENTS[layout[7]] || <PreviewCard index={7} />}
              </div>
            </div>
          </div>
        </div>
      </DndContext> */}
    </div>
  )
}

export default LayoutsSettings
