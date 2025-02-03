import type { BookmarkFolderNode } from '@/types/bookmark-types'
import React from 'react'
import { FolderIcon, FolderOpenIcon } from 'lucide-react'

type Props = BookmarkFolderNode & {
  onOpenFolder: () => void
  layout: "grid" | "list"
}

const BookmarkFolder = (props: Props) => {
  if (props.layout === "grid") {
    return (
      <button
        onClick={props.onOpenFolder}
        className='flex items-center justify-center flex-col space-y-2 p-2 rounded-lg hover:scale-105 transition-transform text-center truncate'>
        {props?.children?.length > 0 ? <FolderOpenIcon
          style={{
            strokeWidth: 1
          }}
          className='size-12 fill-gray-200 text-gray-400 outline-none' /> : <FolderIcon
          style={{
            strokeWidth: 1
          }}
          className='size-12 fill-gray-200 text-gray-400' />}
        <p>
          {props.title.substring(0, 8)}
        </p>
      </button>
    )
  }
  else {
    return (
      <button
        onClick={props.onOpenFolder}
        className='flex items-center space-x-2 p-2 rounded-lg transition-colors'>
        <FolderIcon
          style={{
            strokeWidth: 1
          }}
          className='size-12 fill-gray-200 text-gray-400' />
        <p>
          {props.title}
        </p>
      </button>
    )
  }
}

export default BookmarkFolder