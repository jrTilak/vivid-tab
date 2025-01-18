import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/helpers/cn'

import { Youtube, Facebook, Twitter, Instagram, Linkedin, PlusIcon, } from 'lucide-react'
import React from 'react'
import { useBookmarkContext } from './context'
import type { BookmarkFolderNode, BookmarkUrlNode } from '@/types/bookmark-types'
import BookmarkFolder from './folder'
import BookmarkUrl from './url'

const Bookmarks = () => {
  const { activeRootFolder, hasFilesInRoot, rootFolders, setActiveRootFolder, history, contents } = useBookmarkContext()

  return (
    <div className="mb-6 col-span-6">
      <Tabs
        value={activeRootFolder}
        onValueChange={(value) => {
          if (value === 'more') return
          setActiveRootFolder(value)
        }}
      >
        <TabsList className="w-full flex gap-2.5 flex-wrap items-start justify-start bg-transparent">
          {
            hasFilesInRoot && (
              <TabsTrigger value="home" className='text-sm'>
                Home
              </TabsTrigger>
            )
          }
          {
            history?.length > 0 && (
              <TabsTrigger value="history" className='text-sm'>
                History
              </TabsTrigger>
            )
          }
          {
            rootFolders.map((folder, index) => (
              <TabsTrigger key={index} value={folder.id} className='text-sm'>
                {folder.title}
              </TabsTrigger>
            ))
          }
          <TabsTrigger value='more' onClick={() => console.log('add folder')} className='text-sm'>
            <PlusIcon className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
        <div className="mt-5 bg-transparent">
          <div className="grid grid-cols-7 gap-4">
            {
              contents?.map((content, index) => {
                if ((content as BookmarkFolderNode).children) {
                  return <BookmarkFolder {...content} key={index} />
                } else {
                  return <BookmarkUrl {...content as BookmarkUrlNode} key={index} />
                }
              })
            }
          </div>
        </div>
      </Tabs>
    </div>
  )
}

export default Bookmarks