import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchFavicon } from "@/lib/fetch-favicon"
import { useSettings } from "@/providers/settings-provider"
import type { BookmarkUrlNode } from "@/types/bookmark"
import React, { useCallback, useEffect, useState } from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useAsyncEffect } from "@/hooks/use-async-effect"
import { DeleteIcon, EditIcon, ExternalLinkIcon, MoveIcon } from "lucide-react"
import { DeleteDialog } from "../delete-dialog"
import { CreateABookmark } from "../create-a-bookmark"
import { useIcon } from "@/hooks/use-icon"
import { MoveBookmarkDialog } from "../move-bookmark-dialog"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/cn"

type Props = BookmarkUrlNode & {
  layout: "grid" | "list"
  disableContextMenu?: boolean
  index: number
}

const BookmarkUrl = ({ disableContextMenu = false, ...props }: Props) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { icon, fetchIcon } = useIcon({ id: props.id, defaultIcon: "" })

  const {
    settings: { general },
  } = useSettings()
  const [data, setData] = useState({
    title: props.title,
    image: icon,
  })

  useAsyncEffect(async () => {
    // Skip favicon fetching for file:// URLs
    if (props.url?.startsWith('file://')) {
      // Provide a default file icon for local files
      const defaultFileIcon = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNCAySDZhMiAyIDAgMCAwLTIgMnYxNmEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWOHoiLz48cG9seWxpbmUgcG9pbnRzPSIxNCwyIDE0LDggMjAsOCIvPjwvc3ZnPg=="
      setData({
        image: defaultFileIcon,
        title: props.title,
      })
      return
    }

    const cachedData = await new Promise<{
      favicon: string | null
      expiry: number | null
    }>((resolve) => {
      chrome.storage.local.get([`favicon-${props.url}`], (result) => {
        resolve(
          result[`favicon-${props.url}`] || { favicon: null, expiry: null },
        )
      })
    })

    const currentTime = Date.now()

    if (
      cachedData.favicon &&
      cachedData.expiry &&
      cachedData.expiry > currentTime
    ) {
      // Use cached favicon if it hasn't expired
      setData({
        image: cachedData.favicon,
        title: props.title,
      })
    } else {
      // Fetch new favicon
      const res = await fetchFavicon(props.url || "")
      const faviconUrl = res.favicon

      // Convert the favicon URL to Base64
      const response = await fetch(faviconUrl)
      const blob = await response.blob()
      const reader = new FileReader()

      reader.onloadend = () => {
        const base64data = reader.result as string
        setData({
          image: base64data,
          title: props.title,
        })
        // Set the favicon with an expiration of 1 day (86400000 milliseconds)
        const expiryTime = currentTime + 86400000 // 1 day in milliseconds
        chrome.storage.local.set({
          [`favicon-${props.url}`]: {
            favicon: base64data,
            expiry: expiryTime,
          },
        })
      }

      reader.readAsDataURL(blob)
    }
  }, [props.url])

  useEffect(() => {
    setData((prevState) => ({
      ...prevState,
      title: props.title,
    }))
  }, [props.title])

  useEffect(() => {
    if (!editDialogOpen) {
      fetchIcon()
    }
  }, [editDialogOpen, fetchIcon])

  const openInNewTab = useCallback((url: string) => {
    // Check if the URL is a local file URL
    if (url.startsWith('file://')) {
      // Use Chrome tabs API for local file URLs
      chrome.tabs.create({ url: url, active: true })
    } else {
      window.open(url, "_blank")
    }
  }, [])

  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: { index: props.index },
  })

  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    isDragging,
    transform,
  } = useDraggable({
    id: props.id,
    data: { index: props.index },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const handleClick = (url: string, aux: boolean = false) => {
    // Check if the URL is a local file URL
    if (url.startsWith('file://')) {
      // Use Chrome tabs API for local file URLs
      chrome.tabs.create({ url: url, active: !aux })
      return
    }

    // Use window.open for regular URLs
    if (aux) {
      window.open(url, "_blank")
    } else {
      window.open(url, general.openUrlIn === "current-tab" ? "_self" : "_blank")
    }
  }

  return (
    <>
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        id={props.id}
        label={props.title + " bookmark"}
        url={props.url}
      />
      <CreateABookmark
        open={editDialogOpen}
        setOpen={setEditDialogOpen}
        defaultValues={{
          id: props.id,
          title: props.title,
          url: props.url,
        }}
      />
      <MoveBookmarkDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        id={props.id}
        label={props.title + " bookmark"}
      />
      <ContextMenu>
        <ContextMenuTrigger disabled={disableContextMenu}>
          {props.layout === "grid" ? (
            <div ref={disableContextMenu ? null : setNodeRef}>
              <button
                ref={disableContextMenu ? null : draggableRef}
                style={style}
                onClick={() => handleClick(props.url)}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    // Middle mouse button
                    handleClick(props.url, true)
                  }
                }}
                className={cn(
                  "flex items-center flex-col space-y-1 p-2 rounded-lg hover:scale-105 text-center text-xs w-24",
                  isOver && "bg-accent/10",
                  isDragging && "bg-destructive/20",
                  isDragging && "relative z-50",
                )}
                {...(disableContextMenu ? {} : attributes)}
                {...(disableContextMenu ? {} : listeners)}
              >
                <Avatar
                  className={cn("rounded-none mx-auto transition-transform")}
                >
                  <AvatarImage
                    src={icon || data.image}
                    alt={props.title}
                    className="rounded-md object-contain object-center size-12"
                  />
                  <AvatarFallback className="size-12">
                    {data.title
                      .replace(/[^a-zA-Z ]/g, "")
                      .trim()
                      .toLowerCase()
                      .split(" ")
                      .map((word) => word[0]?.toUpperCase())
                      .join("")
                      .substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-center line-clamp-2 text-xs break-all">
                  {data.title}
                </p>
              </button>
            </div>
          ) : (
            <button
              ref={disableContextMenu ? null : setNodeRef}
              style={style}
              onClick={() => handleClick(props.url)}
              onAuxClick={(event) => {
                if (event.button === 1) {
                  // Middle mouse button
                  handleClick(props.url, true)
                }
              }}
              className={cn(
                "flex items-center space-x-2 p-2 rounded-lg transition-colors hover:bg-accent/10 overflow-hidden w-full",
                isOver && "bg-accent/10",
                isDragging && "bg-destructive/20",
                isDragging && "relative z-50",
              )}
              rel="noreferrer"
            >
              <Avatar
                ref={disableContextMenu ? null : draggableRef}
                className={cn(
                  "rounded-none mx-auto transition-transform",
                  isDragging && "scale-105",
                )}
                {...(disableContextMenu ? {} : attributes)}
                {...(disableContextMenu ? {} : listeners)}
              >
                <AvatarImage
                  src={icon || data.image}
                  alt={props.title}
                  className="rounded-md object-contain object-center size-12"
                />
                <AvatarFallback className="size-12">
                  {data.title
                    .replace(/[^a-zA-Z ]/g, "")
                    .trim()
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word[0]?.toUpperCase())
                    .join("")
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs w-full text-left line-clamp-2">
                {data.title}
                <br />
                {props.url}
              </p>
            </button>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-fit min-w-40">
          <ContextMenuItem onClick={() => openInNewTab(props.url)}>
            Open in new tab
            <ContextMenuShortcut>
              <ExternalLinkIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => setTimeout(() => setEditDialogOpen(true), 100)}
          >
            Edit
            <ContextMenuShortcut>
              <EditIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setTimeout(() => setIsMoveDialogOpen(true), 100)}
          >
            Move
            <ContextMenuShortcut>
              <MoveIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive"
          >
            Delete
            <ContextMenuShortcut>
              <DeleteIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  )
}

export { BookmarkUrl }
