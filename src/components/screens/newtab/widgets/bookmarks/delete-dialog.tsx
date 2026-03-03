import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { removeIconFromLocalStorage } from "@/lib/icons-to-local"
import { Trash2Icon } from "lucide-react"

import React from "react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  id: string
  label: string
  url?: string
}

const DeleteDialog = ({ open, onOpenChange, id, label, url }: Props) => {
  const deleteUrl = () => {
    chrome.bookmarks.getChildren(id, (children) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Failed to get bookmark children:",
          chrome.runtime.lastError,
        )
        
        return
      }

      const done = () => {
        if (!chrome.runtime.lastError) {
          onOpenChange(false)
        } else {
          console.error("Failed to remove bookmark:", chrome.runtime.lastError)
        }
      }

      if (children.length > 0) {
        chrome.bookmarks.removeTree(id, done)
      } else {
        chrome.bookmarks.remove(id, done)
      }
    })

    removeIconFromLocalStorage(`icon-${id}`)

    if (url) {
      removeIconFromLocalStorage(`favicon-${url}`)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete {label}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={deleteUrl}
            className="min-w-32"
          >
            Delete <Trash2Icon className="h-4 w-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { DeleteDialog }
