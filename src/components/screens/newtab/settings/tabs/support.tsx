import { Card, CardContent } from "@/components/ui/card"
import React, { useState } from "react"
import { GithubIcon, StarIcon } from "lucide-react"
import { AskForReview } from "@/components/ask-for-review"

type SupportProps = {
  onCloseSettings?: () => void
}

const Support = ({ onCloseSettings }: SupportProps) => {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const handleReviewClick = () => {
    // Close settings dialog first
    onCloseSettings?.()
    // Open review dialog
    setReviewDialogOpen(true)
  }

  return (
    <>
      <AskForReview
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        skipAutoTrigger={true}
      />
      <div className="p-4 grid grid-cols-2 gap-4">
        {[
          {
            title: "Github",
            url: "https://github.com/jrtilak/vivid-tab",
            icon: <GithubIcon />,
            desc: "Contribute on Github",
            isButton: false,
          },
          {
            title: "Leave a Review",
            icon: <StarIcon />,
            desc: "Help us improve",
            isButton: true,
            onClick: handleReviewClick,
          },
        ].map((item, i) => (
          <Card
            key={i}
            className="overflow-hidden transition-all bg-muted border-solid border shadow-none"
          >
            {item.isButton ? (
              <button
                onClick={item.onClick}
                className="block w-full text-left"
                type="button"
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <h3 className="font-medium leading-none tracking-tight text-xl text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="ml-4 shrink-0 text-foreground/60">
                    {typeof item.icon === "string" ? (
                      <img
                        src={item.icon}
                        alt={item.title}
                        className="rounded-md size-6"
                      />
                    ) : (
                      item.icon
                    )}
                  </div>
                </CardContent>
              </button>
            ) : (
              <a
                href={item.url}
                className="block"
                target="_blank"
                rel="noopener noreferrer"
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <h3 className="font-medium leading-none tracking-tight text-xl text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="ml-4 shrink-0 text-foreground/60">
                    {typeof item.icon === "string" ? (
                      <img
                        src={item.icon}
                        alt={item.title}
                        className="rounded-md size-6"
                      />
                    ) : (
                      item.icon
                    )}
                  </div>
                </CardContent>
              </a>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}

export default Support
