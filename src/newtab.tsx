import Homepage from "@/components/screens/newtab"
import { Settings } from "./components/screens/newtab/settings"
import { RootProvider } from "./providers/root-provider"
import { AskForReview } from "./components/ask-for-review"
import { useState } from "react"

function NewtabPage() {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

  return (
    <RootProvider>
      <AskForReview
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
      />
      <Homepage />
      <div className="flex items-center justify-center gap-4 fixed top-4 right-4">
        <Settings onOpenReviewDialog={() => setIsReviewDialogOpen(true)} />
      </div>
    </RootProvider>
  )
}

export default NewtabPage
