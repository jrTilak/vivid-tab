import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/cn"
import { useSettings } from "@/providers/settings-provider"
import {
  CloudIcon,
  HandCoinsIcon,
  HistoryIcon,
  ImageIcon,
  ImagePlusIcon,
  LayoutGridIcon,
  ListTodoIcon,
  MonitorSmartphone,
  QuoteIcon,
  SearchIcon,
  SettingsIcon,
  TimerIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import * as React from "react"

import GeneralSettings from "./tabs/general"
import LayoutsSettings from "./tabs/layouts"
import QuotesSettings from "./tabs/quotes"
import TemperatureSetting from "./tabs/temperature"
import TimerSettings from "./tabs/timer"
import WallpaperSettings from "./tabs/wallpapers"
import TodosSettings from "./tabs/todos"
import SearchbarSettings from "./tabs/searchbar"
import Background from "./tabs/background"
import BackupAndExportSettings from "./tabs/backup-and-export"
import Support from "./tabs/support"

export function Settings() {
  const { setSettings, settings } = useSettings()
  const [prevSettings, setPrevSettings] = useState(settings)

  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const TABS = [
    {
      label: "General",
      icon: MonitorSmartphone,
      component: GeneralSettings,
    },
    {
      label: "Searchbar",
      icon: SearchIcon,
      component: SearchbarSettings,
    },
    {
      label: "Layout",
      icon: LayoutGridIcon,
      component: LayoutsSettings,
    },
    {
      label: "Wallpaper",
      icon: ImagePlusIcon,
      component: WallpaperSettings,
    },
    {
      label: "Background",
      icon: ImageIcon,
      component: Background,
    },
    {
      label: "Timer",
      icon: TimerIcon,
      component: TimerSettings,
    },
    {
      label: "Weather",
      icon: CloudIcon,
      component: TemperatureSetting,
    },
    {
      label: "Quotes",
      icon: QuoteIcon,
      component: QuotesSettings,
    },
    {
      label: "Todos",
      icon: ListTodoIcon,
      component: TodosSettings,
    },
    {
      label: "Support",
      icon: HandCoinsIcon,
      component: Support,
    },
    {
      label: "Backup & Export",
      icon: HistoryIcon,
      component: BackupAndExportSettings,
    },
  ]

  useEffect(() => {
    if (open) {
      setPrevSettings(settings)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="aspect-square rounded-full inline! size-fit text-background dark:text-foreground">
        <SettingsIcon size={20} opacity={0.9} />
      </DialogTrigger>
      <DialogContent className="flex max-w-4xl gap-0 p-0 z-50 bg-background max-h-[632px] h-full">
        <div className="w-60 border-r">
          <nav className="flex flex-col gap-1 p-1">
            {TABS.map((tab, index) => {
              if (!tab) return <div key={index} className="my-2 border-t" />

              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={cn(
                    "justify-start gap-2 rounded-sm border-b border-border/50",
                    activeTabIndex === index &&
                      "bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground",
                  )}
                  onClick={() => setActiveTabIndex(index)}
                >
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
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
              }}
              size="sm"
              variant="outline"
              className="min-w-28"
            >
              Save
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
