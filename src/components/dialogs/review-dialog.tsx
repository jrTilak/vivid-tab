import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { REVIEW_TRACKING } from "@/constants/keys"
import React, { useState } from "react"
import { ReviewConfirmationDialog } from "./review-confirmation-dialog"

type ReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [userLikedExtension, setUserLikedExtension] = useState(false)

  const handleResponse = (liked: boolean) => {
    setUserLikedExtension(liked)
    onOpenChange(false)
    setShowConfirmation(true)

    // Mark review as asked
    chrome.storage.local.set({
      [REVIEW_TRACKING.reviewAsked]: true,
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="vt-dialog sm:max-w-md"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="vt-dialog__title">
              Enjoying Vivid Tab?
            </DialogTitle>
            <DialogDescription className="vt-dialog__message">
              Would you like to share your experience with us?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              type="button"
              onClick={() => handleResponse(true)}
              className="vt-dialog__cta w-full"
              autoFocus
            >
              Yes, I love it!
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleResponse(false)}
              className="vt-dialog__cta w-full"
            >
              Not really
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReviewConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        userLikedExtension={userLikedExtension}
      />
    </>
  )
}
