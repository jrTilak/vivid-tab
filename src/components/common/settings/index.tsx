import { useSettings } from '@/providers/settings-provider';
import {
  CloudIcon,
  LaptopMinimalIcon, ListTodoIcon,
  QuoteIcon,
  ScrollTextIcon,
  SettingsIcon,
  TextQuoteIcon,
  TimerIcon
} from 'lucide-react';
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
import { cn } from '@/helpers/cn';
import TemperatureSetting from './tabs/temperature';
import QuotesSettings from './tabs/quotes';
import TodosSettings from "@/components/common/settings/tabs/todos";
export function Settings() {
  const { settings, resetSettings } = useSettings();
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
      label: 'Weather',
      icon: CloudIcon,
      component: TemperatureSetting
    }, {
      label: 'Quotes',
      icon: QuoteIcon,
      component: QuotesSettings
    }, {
      label: 'Todos',
      icon: ListTodoIcon,
      component: TodosSettings
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
      <DialogContent className="flex max-w-3xl gap-0 p-0 z-50 bg-black/90 min-h-[600px]">
        <div className="w-60 border-r">
          <nav className="flex flex-col gap-1 p-1">
            {
              TABS.map((tab, index) => {
                if (!tab) return <div key={index} className="my-2 border-t" />
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={cn("justify-start gap-2 rounded-sm", activeTabIndex === index && 'bg-muted')}
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
          <div className='mb-20 max-h-[500px] overflow-y-scroll h-full'>
            {
              React.createElement(TABS[activeTabIndex].component)
            }
          </div>
          <DialogFooter className="border-t p-4 absolute bottom-0 right-0 w-full">
            <Button size='sm' variant="ghost" onClick={() => {
              resetSettings()
              setOpen(false)
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => setOpen(false)}
              size='sm'
              variant='outline'
              className='min-w-28'>Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog >
  );
}




