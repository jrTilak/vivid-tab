import React, { useCallback, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFlattenBookmarkFolders } from "@/hooks/use-flatten-bookmark-folders"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  id: string
  label: string
}

const MoveBookmarkDialog = ({ open, onOpenChange, id, label }: Props) => {
  const folders = useFlattenBookmarkFolders()
  const [selectedFolder, setSelectedFolder] = useState<string>("")

  const moveBookmark = useCallback((from: string, to: string) => {
    chrome.bookmarks.move(from, {
      parentId: to,
    })
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move {label} to?</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <Select
            value={selectedFolder}
            disabled={folders.length === 0}
            onValueChange={(value) => setSelectedFolder(value)}
          >
            <SelectTrigger value={null}>
              <SelectValue
                placeholder={
                  folders.length === 0
                    ? "No browser bookmarks found"
                    : "Select folder"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <span
                    style={{
                      paddingLeft: folder.depth * 10,
                    }}
                  >
                    {folder.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button
            disabled={!selectedFolder}
            onClick={() => moveBookmark(id, selectedFolder)}
            type="button"
            variant="secondary"
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { MoveBookmarkDialog }
