import type { BookmarkFolderNode, Bookmarks, BookmarkUrlNode } from '@/types/bookmark-types'
import React from 'react'
import { useBookmarkContext } from './context'
import { FolderIcon, FolderOpenIcon } from 'lucide-react'

type Props = BookmarkFolderNode

const BookmarkFolder = (props: Props) => {
  const { setContents, pushToParentFolderIds } = useBookmarkContext()

  const onOpenFolder = () => {
    if (!props?.children || props?.children?.length === 0) return
    setContents(props.children)
    pushToParentFolderIds(props.id)
  }

  return (
    <button
      onClick={onOpenFolder}
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

export default BookmarkFolder