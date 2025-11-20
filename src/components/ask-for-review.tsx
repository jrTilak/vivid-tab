import sadEmoji from "data-base64:@/assets/sad.png"
import happyEmoji from "data-base64:@/assets/happy.png"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Button, buttonVariants } from "./ui/button"
import { cn } from "@/lib/cn"


const AskForReview = () => {
  const [isOpen, setIsOpen] = useState(true)

  //check whether to show the dialog or not!
  useEffect(() => {
  }, [])

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Enjoying Vivid Tab?</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Leave a review so we can improve and provide better user experience.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 pt-6 justify-center">
          <a
            className={cn(buttonVariants({ variant: "outline" }), "flex flex-col min-w-[150px] aspect-square h-auto aspect-square px-4 py-4")}
            href={process.env.PLASMO_PUBLIC_FEEDBACK_URL}>
            <img src={sadEmoji} className="h-[100px] w-[100px]" />
            Not really
          </a>
          <a
            className={cn(buttonVariants({ variant: "outline" }), "flex flex-col min-w-[150px] aspect-square h-auto aspect-square px-4 py-4")}
            href={process.env.PLASMO_PUBLIC_BROWSER_NAME === "firefox" ? process.env.PLASMO_PUBLIC_FIREFOX_ADDON_URL : process.env.PLASMO_PUBLIC_CHROME_WEBSTORE_URL}>
            <img src={happyEmoji} className="h-[100px] w-[100px]" />
            Yes, It's awesome!
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AskForReview }
