import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getBrowserStoreUrl, getFeedbackFormUrl } from "@/lib/browser-detection"
import React from "react"

type ReviewConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userLikedExtension: boolean
}

export const ReviewConfirmationDialog: React.FC<
  ReviewConfirmationDialogProps
> = ({ open, onOpenChange, userLikedExtension }) => {
  const handleCtaClick = () => {
    const url = userLikedExtension
      ? getBrowserStoreUrl()
      : getFeedbackFormUrl()
    chrome.tabs.create({ url })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="vt-dialog sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="vt-dialog__title">
            {userLikedExtension ? "Thanks! One last step" : "Help us improve"}
          </DialogTitle>
          <DialogDescription className="vt-dialog__message">
            {userLikedExtension
              ? "Please rate Vivid Tab on your browser store"
              : "We'd appreciate a moment of your feedback"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            onClick={handleCtaClick}
            className="vt-dialog__cta w-full sm:w-auto"
            autoFocus
          >
            {userLikedExtension ? "Rate Now" : "Give Feedback"}
          </Button>
        </DialogFooter>
        {userLikedExtension && (
          <p className="vt-dialog__hint text-xs text-center text-muted-foreground mt-2">
            Scroll to the rating section
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
