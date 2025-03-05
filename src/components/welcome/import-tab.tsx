import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import useActiveTab from "@/hooks/use-active-tab"
import { ANIMATIONS } from "@/tabs/welcome"
import {
  ChevronLeftIcon,
  ChevronRight,
  ChevronRightIcon,
  PlusCircleIcon,
  StarIcon,
} from "lucide-react"
import { motion } from "motion/react"
import React from "react"
import type { Props } from "."

const ImportTab = ({ scrollToTab, animation, setAnimation }: Props) => {
  const activeTabId = useActiveTab()

  return (
    <motion.div {...ANIMATIONS[animation]}>
      <Card className="w-full max-w-lg bg-background text-center min-w-[512px]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Import Bookmarks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the import source for your bookmarks
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => {
              scrollToTab("CREATE_NEW_BOOKMARK_FOLDER")
              setAnimation("rightToLeft")
            }}
            variant="ghost"
            className="w-full justify-start h-14 bg-muted/50 hover:bg-muted"
          >
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Create a new bookmark folder
            <ChevronRightIcon className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            onClick={() => {
              scrollToTab("IMPORT_FROM_BROWSER_BOOKMARKS")
              setAnimation("rightToLeft")
            }}
            variant="ghost"
            className="w-full justify-start h-14 bg-muted/50 hover:bg-muted"
          >
            <StarIcon className="mr-2 h-4 w-4" />
            Import from browser bookmarks
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
        </CardContent>
        <CardFooter className="justify-between pt-6">
          <Button
            onClick={() => {
              scrollToTab("WELCOME")
              setAnimation("leftToRight")
            }}
            variant="ghost"
            size="sm"
          >
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            BACK
          </Button>
          <Button
            onClick={() => {
              chrome.tabs.create({})
              chrome.tabs.remove(activeTabId)
            }}
            variant="ghost"
            size="sm"
          >
            SKIP
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default ImportTab
