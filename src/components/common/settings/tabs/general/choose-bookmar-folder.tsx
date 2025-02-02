import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, Folder } from "lucide-react"
import { useBookmarkFolderNavigation } from "@/hooks/use-bookmarks-folder-navigation"
import { useSettings } from "@/providers/settings-provider"

export function ChooseBookmarkFolder() {
  const [open, setOpen] = useState(false)
  const { currentFolders, folderPath, selectedFolder, openFolder, goBack, selectFolder } = useBookmarkFolderNavigation()
  const { setSettings } = useSettings()

  const handleSelect = () => {
    if (selectedFolder) {
      setSettings((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          rootFolder: selectedFolder.id
        }
      }))
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Change
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select a Folder</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="sm" className="h-6 w-6" onClick={goBack} disabled={folderPath.length === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">{folderPath.map((folder) => folder.title).join(" / ")}</div>
        </div>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4 text-sm">
          {

            currentFolders.length === 0 ? <div className="text-center text-muted-foreground">No folders found</div>
              :
              currentFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`grid grid-cols-[20px_1fr] items-center gap-2 p-2 cursor-pointer rounded-md ${selectedFolder?.id === folder.id ? "bg-muted" : ""
                    }`}
                  onClick={() => selectFolder(folder)}
                  onDoubleClick={() => openFolder(folder)}
                >
                  <Folder className="h-4 w-4 min-w-4 min-h-4" />
                  <span>{folder.title}</span>
                </div>
              ))}
        </ScrollArea>
        <Button onClick={handleSelect} disabled={!selectedFolder}>
          Select
        </Button>
      </DialogContent>
    </Dialog>
  )
}

