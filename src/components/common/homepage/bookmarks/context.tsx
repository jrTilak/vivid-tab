import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { BookmarkFolderNode, Bookmarks as BookmarksType, BookmarkUrlNode } from '@/types/bookmark-types'
import { BACKGROUND_ACTIONS } from "@/common/constants";
import { type HistoryItem } from "@/types/history-types";
interface BookmarkContextType {
  activeRootFolder: string | null;
  setActiveRootFolder: React.Dispatch<React.SetStateAction<string | null>>;
  bookmarks: BookmarksType;
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarksType>>;
  rootFolders: BookmarkFolderNode[];
  setRootFolders: React.Dispatch<React.SetStateAction<BookmarkFolderNode[]>>;
  hasFilesInRoot: boolean;
  setHasFilesInRoot: React.Dispatch<React.SetStateAction<boolean>>;
  contents: BookmarksType;
  setContents: React.Dispatch<React.SetStateAction<BookmarksType>>;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  popFromParentFolderIds: (id: string) => void;
  pushToParentFolderIds: (id: string) => void;
  parentFolderIds: string[];
}

// Create the context with a default value
const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

// Create a provider component
export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRootFolder, setActiveRootFolder] = useState<string>("history");
  const [bookmarks, setBookmarks] = useState<BookmarksType>([]);
  const [rootFolders, setRootFolders] = useState<BookmarkFolderNode[]>([]);
  const [hasFilesInRoot, setHasFilesInRoot] = useState(false);
  const [contents, setContents] = useState<BookmarksType>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [parentFolderIds, setParentFolderIds] = useState<string[]>([]);


  const getBookmarkFolder = useCallback((id: string, bookmarks: BookmarksType): BookmarkFolderNode | null => {
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
  }, [])

  useEffect(() => {
    chrome.runtime.sendMessage({ action: BACKGROUND_ACTIONS.GET_BOOKMARKS }, (response: BookmarksType = []) => {
      console.log(response);
      const folder = getBookmarkFolder("16", response)
      const data = folder?.children || [];

      console.log(folder);

      setBookmarks(data);

      const folders = data.filter((node: BookmarkFolderNode) => node.children);

      setRootFolders(folders);
      const hasFiles = data.some((node: BookmarkUrlNode) => node.url);
      setHasFilesInRoot(hasFiles);
    });


    chrome.runtime.sendMessage({ action: BACKGROUND_ACTIONS.GET_HISTORY }, (response) => {
      setHistory(response);
      setContents(response);
    });

  }, []);

  const popFromParentFolderIds = (id: string) => {
    const index = parentFolderIds.indexOf(id);
    if (index !== -1) {
      setParentFolderIds(parentFolderIds.slice(0, index));
    }
  }

  const pushToParentFolderIds = (id: string) => {
    setParentFolderIds([...parentFolderIds, id]);
  }


  useEffect(() => {
    if (activeRootFolder === 'history') {
      const contents: BookmarksType = history.map((item) => ({
        id: item.id,
        title: item.title,
        dateAdded: item.lastVisitTime,
        url: item.url,
      }));

      setContents(contents);
    } else {
      const contents = (bookmarks.find((node) => node.id === activeRootFolder) as BookmarkFolderNode)?.children || [];
      setContents(contents);
    }
  }, [activeRootFolder]);

  const value: BookmarkContextType = {
    activeRootFolder,
    setActiveRootFolder,
    bookmarks,
    setBookmarks,
    rootFolders,
    setRootFolders,
    hasFilesInRoot,
    setHasFilesInRoot,
    contents,
    setContents,
    history,
    setHistory,
    popFromParentFolderIds,
    pushToParentFolderIds,
    parentFolderIds
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarkContext = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarkContext must be used within a BookmarkProvider');
  }
  return context;
};
