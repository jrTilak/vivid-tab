import { Card, CardContent } from "@/components/ui/card"
import React, { useState } from "react"
import { GithubIcon, StarIcon } from "lucide-react"
import { AskForReview } from "@/components/ask-for-review"

type SupportProps = {
  onCloseSettings?: () => void
}

type SupportItem =
  | {
      title: string
      icon: React.ReactNode
      desc: string
      isButton: false
      url: string
    }
  | {
      title: string
      icon: React.ReactNode
      desc: string
      isButton: true
      onClick: () => void
    }

const SupportCardContent = ({
  title,
  desc,
  icon,
}: {
  title: string
  desc: string
  icon: React.ReactNode
}) => (
  <CardContent className="flex items-center justify-between p-6">
    <div className="space-y-1">
      <h3 className="font-medium leading-none tracking-tight text-xl text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
    <div className="ml-4 shrink-0 text-foreground/60">
      {typeof icon === "string" ? (
        <img src={icon} alt={title} className="rounded-md size-6" />
      ) : (
        icon
      )}
    </div>
  </CardContent>
)

const Support = ({ onCloseSettings }: SupportProps) => {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const handleReviewClick = () => {
    // Close settings dialog first
    onCloseSettings?.()
    // Open review dialog
    setReviewDialogOpen(true)
  }

  const items: SupportItem[] = [
    {
      title: "GitHub",
      url: "https://github.com/jrtilak/vivid-tab",
      icon: <GithubIcon />,
      desc: "Contribute on GitHub",
      isButton: false,
    },
    {
      title: "Leave a Review",
      icon: <StarIcon />,
      desc: "Help us improve",
      isButton: true,
      onClick: handleReviewClick,
    },
  ]

  return (
    <>
      <AskForReview
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        skipAutoTrigger={true}
      />
      <div className="p-4 grid grid-cols-2 gap-4">
        {items.map((item, i) => (
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
                <SupportCardContent
                  title={item.title}
                  desc={item.desc}
                  icon={item.icon}
                />
              </button>
            ) : (
              <a
                href={item.url}
                className="block"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SupportCardContent
                  title={item.title}
                  desc={item.desc}
                  icon={item.icon}
                />
              </a>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}

export default Support
