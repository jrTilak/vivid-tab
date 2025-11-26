import { Card, CardContent } from "@/components/ui/card"
import React from "react"
import { GithubIcon, StarIcon } from "lucide-react"

type SupportProps = {
  onOpenReviewDialog: () => void
}

const Support = ({ onOpenReviewDialog }: SupportProps) => {
  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      <Card className="overflow-hidden transition-all bg-muted border-solid border shadow-none">
        <a
          href="https://github.com/jrtilak/vivid-tab"
          className="block"
          target="_blank"
          rel="noopener noreferrer"
        >
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <h3 className="font-medium leading-none tracking-tight text-xl text-foreground">
                GitHub
              </h3>
              <p className="text-sm text-muted-foreground">
                Contribute on GitHub
              </p>
            </div>
            <div className="ml-4 shrink-0 text-foreground/60">
              <GithubIcon />
            </div>
          </CardContent>
        </a>
      </Card>
      <Card className="overflow-hidden transition-all bg-muted border-solid border shadow-none">
        <button
          onClick={onOpenReviewDialog}
          className="block w-full text-left"
          type="button"
        >
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <h3 className="font-medium leading-none tracking-tight text-xl text-foreground">
                Leave a Review
              </h3>
              <p className="text-sm text-muted-foreground">Help us improve</p>
            </div>
            <div className="ml-4 shrink-0 text-foreground/60">
              <StarIcon />
            </div>
          </CardContent>
        </button>
      </Card>
    </div>
  )
}

export default Support
