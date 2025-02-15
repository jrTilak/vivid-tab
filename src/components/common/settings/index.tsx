import TodosSettings from "@/components/common/settings/tabs/todos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { cn } from "@/helpers/cn"
import stylesFns from "@/helpers/styles-fns"
import { useSettings } from "@/providers/settings-provider"
import {
  Bookmark,
  CloudIcon,
  HistoryIcon,
  Image,
  ImageIcon,
  LaptopMinimalIcon,
  Layout,
  LayoutGridIcon,
  ListTodoIcon,
  LogOut,
  MonitorSmartphone,
  QuoteIcon,
  ScrollTextIcon,
  Search,
  SettingsIcon,
  NotebookTabsIcon as Tabs,
  TextQuoteIcon,
  TimerIcon,
  User,
  X
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import * as React from "react"

import GeneralSettings from "./tabs/general"
import LayoutsSettings from "./tabs/layouts"
import QuotesSettings from "./tabs/quotes"
import TemperatureSetting from "./tabs/temperature"
import TimerSettings from "./tabs/timer"
import WallpaperSettings from "./tabs/wallpapers"

export function Settings() {
  const { setSettings, settings } = useSettings()
  const [prevSettings, setPrevSettings] = useState(settings)

  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const TABS = [
    {
      label: "General",
      icon: MonitorSmartphone,
      component: GeneralSettings
    },
    {
      label: "Layout",
      icon: LayoutGridIcon,
      component: LayoutsSettings
    },
    {
      label: "Wallpaper",
      icon: ImageIcon,
      component: WallpaperSettings
    },
    {
      label: "Timer",
      icon: TimerIcon,
      component: TimerSettings
    },
    {
      label: "Weather",
      icon: CloudIcon,
      component: TemperatureSetting
    },
    {
      label: "Quotes",
      icon: QuoteIcon,
      component: QuotesSettings
    },
    {
      label: "Todos",
      icon: ListTodoIcon,
      component: TodosSettings
    },
    {
      label: "Backup & Sync",
      icon: HistoryIcon,
      component: () => <div>Coming soon...</div>
    }
  ]

  useEffect(() => {
    if (open) {
      setPrevSettings(settings)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="fixed z-50 aspect-square rounded-full !inline size-fit top-4 right-4">
        <SettingsIcon size={20} opacity={0.7} />
      </DialogTrigger>
      <DialogContent className="flex max-w-4xl gap-0 p-0 z-50 bg-black/90 max-h-[632px] h-full">
        <div className="w-60 border-r">
          <nav className="flex flex-col gap-1 p-1">
            {TABS.map((tab, index) => {
              if (!tab) return <div key={index} className="my-2 border-t" />
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={cn(
                    "justify-start gap-2 rounded-sm",
                    activeTabIndex === index && "bg-muted"
                  )}
                  onClick={() => setActiveTabIndex(index)}>
                  <tab.icon size={20} />
                  {tab.label}
                </Button>
              )
            })}
          </nav>
        </div>
        <div className="flex-1 relative">
          <DialogHeader className="border-b px-4 py-4">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="mb-20 max-h-[500px] overflow-y-scroll h-full">
            {React.createElement(TABS[activeTabIndex].component)}
          </div>
          <DialogFooter className="border-t p-4 absolute bottom-0 right-0 w-full">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setSettings(prevSettings)
              }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
              }}
              size="sm"
              variant="outline"
              className="min-w-28">
              Save
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
