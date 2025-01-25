import React, { useCallback, useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useSettings } from '@/providers/settings-provider'
import type { SettingsConfig } from '@/types/setting-types'
import { Label } from '@/components/ui/label'
import { useTheme, type Theme } from '@/providers/theme-provider'
import { Button } from '@/components/ui/button'
import type { BookmarkFolderNode, Bookmarks } from '@/types/bookmark-types'
import { BACKGROUND_ACTIONS } from '@/common/constants'

const GeneralSettings = () => {
  const { settings: { timer, general: { rootFolder } }, setSettings, } = useSettings()
  const { setTheme, theme } = useTheme()
  const [bookmarks, setBookmarks] = useState<Bookmarks>([])

  useEffect(() => {
    chrome.runtime.sendMessage({ action: BACKGROUND_ACTIONS.GET_BOOKMARKS }, (response: Bookmarks = []) => {
      const data = response[0]?.id == "0" ? (response[0] as BookmarkFolderNode).children : response;
      setBookmarks(data);
    });
  }, []);

  const getBookmarkFolder = useCallback((id: string): BookmarkFolderNode | null => {
    const findNode = (nodes: BookmarkFolderNode[], id: string): BookmarkFolderNode | null => {
      for (const node of nodes) {
        if (node.id === id) {
          return node
        }
        if (node.children) {
          const foundNode = findNode(node.children as BookmarkFolderNode[], id)
          if (foundNode) {
            return foundNode
          }
        }
      }
      return null
    }
    return findNode(bookmarks, id)
  }, [bookmarks])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Theme</label>
        </div>
        <Select
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {
              ([
                {
                  label: "System",
                  value: "system"

                },
                {
                  label: "Light",
                  value: "light"

                },
                {
                  label: "Dark",
                  value: "dark"

                }
              ] as const).map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Root Folder</label>
        </div>
        <div>
          ({getBookmarkFolder(rootFolder)?.title})
          <Button
            size='sm'
            variant='outline'
          >Change</Button>
        </div>
      </div>
    </div>
  )
}

export default GeneralSettings