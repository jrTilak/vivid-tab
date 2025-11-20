import sadEmoji from "data-base64:@/assets/sad.png"
import happyEmoji from "data-base64:@/assets/happy.png"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { buttonVariants } from "./ui/button"
import { cn } from "@/lib/cn"
import { LOCAL_STORAGE } from "@/constants/keys"

const AskForReview = () => {
  const [isOpen, setIsOpen] = useState(false)

  // Check whether to show the dialog or not!
  useEffect(() => {
    const checkAndShowReview = async () => {
      try {
        const result = await chrome.storage.local.get([
          LOCAL_STORAGE.installedDate,
          LOCAL_STORAGE.reviewLastAskedAt,
          LOCAL_STORAGE.reviewTimesAsked,
        ])

        const installedDate = result[LOCAL_STORAGE.installedDate]
        const lastAskedAt = result[LOCAL_STORAGE.reviewLastAskedAt]
        const timesAsked = result[LOCAL_STORAGE.reviewTimesAsked] || 0

        // Don't show if already asked 4 times
        if (timesAsked >= 4) {
          return
        }

        // Don't show if no install date
        if (!installedDate) {
          return
        }

        const now = new Date()
        const installed = new Date(installedDate)
        const daysSinceInstall = Math.floor(
          (now.getTime() - installed.getTime()) / (1000 * 60 * 60 * 24),
        )

        // First time: show on 7th day
        if (timesAsked === 0 && daysSinceInstall >= 7) {
          setIsOpen(true)
          // Save the timestamp and increment count
          await chrome.storage.local.set({
            [LOCAL_STORAGE.reviewLastAskedAt]: now.toString(),
            [LOCAL_STORAGE.reviewTimesAsked]: 1,
          })

          return
        }

        // Subsequent times: show every 3 months (90 days)
        if (timesAsked > 0 && lastAskedAt) {
          const lastAsked = new Date(lastAskedAt)
          const daysSinceLastAsk = Math.floor(
            (now.getTime() - lastAsked.getTime()) / (1000 * 60 * 60 * 24),
          )

          if (daysSinceLastAsk >= 90) {
            setIsOpen(true)
            // Save the timestamp and increment count
            await chrome.storage.local.set({
              [LOCAL_STORAGE.reviewLastAskedAt]: now.toString(),
              [LOCAL_STORAGE.reviewTimesAsked]: timesAsked + 1,
            })
          }
        }
      } catch (error) {
        console.error("Error checking review status:", error)
      }
    }

    checkAndShowReview()
  }, [])

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Enjoying Vivid Tab?</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Leave a review so we can improve and provide better user experience.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 pt-6 justify-center">
          <a
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex flex-col min-w-[150px] aspect-square h-auto aspect-square px-4 py-4",
            )}
            href={process.env.PLASMO_PUBLIC_FEEDBACK_URL}
          >
            <img
              src={sadEmoji}
              className="h-[100px] w-[100px]"
              alt="Sad emoji"
            />
            Not really
          </a>
          <a
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex flex-col min-w-[150px] aspect-square h-auto aspect-square px-4 py-4",
            )}
            href={
              process.env.PLASMO_PUBLIC_BROWSER_NAME === "firefox"
                ? process.env.PLASMO_PUBLIC_FIREFOX_ADDON_URL
                : process.env.PLASMO_PUBLIC_CHROME_WEBSTORE_URL
            }
          >
            <img
              src={happyEmoji}
              className="h-[100px] w-[100px]"
              alt="Happy emoji"
            />
            Yes, It&apos;s awesome!
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { AskForReview }
