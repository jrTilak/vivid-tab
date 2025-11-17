import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ANIMATION_PROPS } from "@/constants/animations"
import { useBrowserActiveTab } from "@/hooks/use-browser-active-tab"
import {
  ChevronLeftIcon,
  ChevronRight,
  ChevronRightIcon,
  PlusCircleIcon,
  StarIcon,
} from "lucide-react"
import { motion } from "motion/react"
import { useWelcomeContext } from "./_context"

const ImportTab = () => {
  const activeTabId = useBrowserActiveTab()
  const { animationName, scrollToTab, setAnimationName } = useWelcomeContext()

  return (
    <motion.div {...ANIMATION_PROPS[animationName]}>
      <Card className="w-full max-w-lg text-center min-w-[512px] text-foreground gap-4">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Import Bookmarks</CardTitle>
          <p className="text-sm">Select the import source for your bookmarks</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => {
              scrollToTab("CREATE_NEW_BOOKMARK_FOLDER")
              setAnimationName("rightToLeft")
            }}
            variant="outline"
            className="w-full justify-start h-14 border-transparent dark:border-input "
          >
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Create a new bookmark folder
            <ChevronRightIcon className="ml-auto h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            onClick={() => {
              scrollToTab("IMPORT_FROM_BROWSER_BOOKMARKS")
              setAnimationName("rightToLeft")
            }}
            variant="outline"
            className="w-full justify-start h-14 border-transparent dark:border-input"
          >
            <StarIcon className="mr-2 h-4 w-4" />
            Import from browser bookmarks
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground " />
          </Button>
        </CardContent>
        <CardFooter className="justify-between pt-6">
          <Button
            onClick={() => {
              scrollToTab("WELCOME")
              setAnimationName("leftToRight")
            }}
            variant="ghost"
            size="sm"
          >
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            BACK
          </Button>
          <Button
            onClick={() => {
              chrome.tabs.create({}, () => {
                chrome.tabs.remove(activeTabId)
              })
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

export { ImportTab }
