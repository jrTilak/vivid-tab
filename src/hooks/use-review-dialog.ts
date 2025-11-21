import { REVIEW_TRACKING } from "@/constants/keys"
import { useEffect, useState } from "react"

const DAYS_BEFORE_ASKING = 3 // Ask for review after 3 days

export const useReviewDialog = () => {
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  useEffect(() => {
    const checkReviewStatus = async () => {
      chrome.storage.local.get(
        [
          REVIEW_TRACKING.installDate,
          REVIEW_TRACKING.reviewAsked,
          REVIEW_TRACKING.reviewCompleted,
        ],
        (result) => {
          const installDate = result[REVIEW_TRACKING.installDate]
          const reviewAsked = result[REVIEW_TRACKING.reviewAsked]
          const reviewCompleted = result[REVIEW_TRACKING.reviewCompleted]

          // If review already asked or completed, don't show again
          if (reviewAsked || reviewCompleted) {
            return
          }

          // If no install date, set it now
          if (!installDate) {
            chrome.storage.local.set({
              [REVIEW_TRACKING.installDate]: Date.now(),
            })

            return
          }

          // Check if enough days have passed
          const daysSinceInstall =
            (Date.now() - installDate) / (1000 * 60 * 60 * 24)

          if (daysSinceInstall >= DAYS_BEFORE_ASKING) {
            setShowReviewDialog(true)
          }
        },
      )
    }

    checkReviewStatus()
  }, [])

  return {
    showReviewDialog,
    setShowReviewDialog,
  }
}
