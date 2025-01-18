import React from 'react'
import { BookmarkProvider } from './context'
import B from './bookmarks'
const Bookmarks = () => {
  return (
    <BookmarkProvider>
      <B />
    </BookmarkProvider>
  )
}

export default Bookmarks