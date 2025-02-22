import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fetchFavicon } from "@/lib/fetch-favicon"
import { useSettings } from "@/providers/settings-provider"
import type { BookmarkUrlNode } from "@/types/bookmark-types"
import React, { useCallback, useState } from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import useAsyncEffect from "@/hooks/use-async-effect"
import { DeleteIcon, EditIcon, ExternalLinkIcon, MoveIcon } from "lucide-react"
import DeleteDialog from "../delete-dialog"
import CreateABookmark from "../create-a-bookmark"

type Props = BookmarkUrlNode & {
  layout: "grid" | "list"
  disableContextMenu?: boolean
}

const BookmarkUrl = ({ disableContextMenu = false, ...props }: Props) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const {
    settings: { general },
  } = useSettings()
  const [data, setData] = useState({
    title: props.title,
    image: "",
  })

  useAsyncEffect(async () => {
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

  const openInNewTab = useCallback((url: string) => {
    window.open(url, "_blank")
  }, [])

  return (
    <>
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        id={props.id}
        label={props.title + " bookmark"}
      />
      <CreateABookmark open={editDialogOpen} setOpen={setEditDialogOpen} defaultValues={{
        id: props.id,
        title: props.title,
        url: props.url
      }} />
      <ContextMenu >
        <ContextMenuTrigger disabled={disableContextMenu}>
          {
            props.layout === "grid" ? (
              <a
                href={props.url}
                target={general.openUrlIn === "new-tab" ? "_blank" : "_self"}
                className="flex items-center flex-col space-y-1 p-2 rounded-lg hover:scale-105 transition-transform text-center text-xs w-24"
                rel="noreferrer"
              >
                <Avatar className="rounded-none mx-auto">
                  <AvatarImage
                    src={data.image}
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
              </a>
            ) : (
              <a
                href={props.url}
                target={general.openUrlIn === "new-tab" ? "_blank" : "_self"}
                className="flex items-center space-x-2 p-2 rounded-lg transition-colors hover:bg-accent/10"
                rel="noreferrer"
              >
                <Avatar className="rounded-none">
                  <AvatarImage
                    src={data.image}
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
                <p className="truncate flex flex-col gap-1">
                  <span> {data.title}</span>
                  <span className="text-xs truncate">{props.url}</span>
                </p>
              </a>
            )
          }
        </ContextMenuTrigger>
        <ContextMenuContent className="w-fit min-w-40">
          <ContextMenuItem
            onClick={() => openInNewTab(props.url)}
          >
            Open in new tab
            <ContextMenuShortcut>
              <ExternalLinkIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => setEditDialogOpen(true)}
          >
            Edit
            <ContextMenuShortcut>
              <EditIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem >
            Move
            <ContextMenuShortcut>
              <MoveIcon className="size-4" />
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive">
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

export default BookmarkUrl
