import { useSettings } from '@/providers/settings-provider';
import { LaptopMinimalIcon, SettingsIcon, TimerIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as React from "react"
import { Bookmark, Image, Layout, LogOut, MonitorSmartphone, Search, NotebookTabsIcon as Tabs, User, X } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import TimerSettings from './tabs/timer';
import stylesFns from '@/helpers/styles-fns';
export function Settings() {
  const { settings } = useSettings();
  const config = settings.others.triggerButton

  const [triggerPosition, setTriggerPosition] = useState(() => stylesFns.settingsTriggerPosition(config.position))
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setTriggerPosition(stylesFns.settingsTriggerPosition(config.position))
  }, [config.position])

  const TABS = [
    {
      label: 'Timer',
      icon: TimerIcon,
      component: TimerSettings
    },
    {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    }, {
      label: 'General',
      icon: MonitorSmartphone,
      component: TimerSettings
    },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        style={{ ...triggerPosition }}
        className='fixed z-50 aspect-square rounded-full !inline size-fit'
      >
        <SettingsIcon size={config.size} opacity={config.opacity} />
      </DialogTrigger>
      <DialogContent className="flex max-w-3xl gap-0 p-0 z-50">
        <div className="w-60 border-r">
          <nav className="flex flex-col gap-1 p-1">
            {
              TABS.map((tab, index) => {
                if (!tab) return <div key={index} className="my-2 border-t" />
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className="justify-start gap-2 rounded-sm"
                    onClick={() => setActiveTabIndex(index)}
                  >
                    <tab.icon size={20} />
                    {tab.label}
                  </Button>
                )
              })
            }
          </nav>
        </div>
        <div className="flex-1 relative">
          <DialogHeader className="border-b px-4 py-4">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          {
            React.createElement(TABS[activeTabIndex].component)
          }
          <DialogFooter className="border-t p-4 absolute bottom-0 right-0 w-full">
            <Button size='sm' variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size='sm' className='min-w-28'>Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog >
  );
}




