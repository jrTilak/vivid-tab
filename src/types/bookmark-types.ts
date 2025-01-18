export interface BookmarkBaseNode {
  id: string // Unique identifier for the node
  title: string // Title of the node
  dateAdded: number // Timestamp when the node was added
  parentId?: string // ID of the parent node
  index?: number // Position of the node within its parent
}

// Type for folders
export interface BookmarkFolderNode extends BookmarkBaseNode {
  dateGroupModified?: number // Timestamp when the folder was last modified
  children?: BookmarkTreeNode[] // Array of child nodes
}

// Type for bookmarks
export interface BookmarkUrlNode extends BookmarkBaseNode {
  url: string // URL of the bookmark
}

export type BookmarkTreeNode = BookmarkFolderNode | BookmarkUrlNode

export type Bookmarks = BookmarkTreeNode[]
