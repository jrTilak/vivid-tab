import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ANIMATION_PROPS } from "@/constants/animations"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { motion } from "motion/react"
import { useWelcomeContext } from "./_context"

// 16:9 aspect ratio for video player (9/16 = 0.5625)
const VIDEO_ASPECT_RATIO_PADDING = "56.25%"

const YouTubeVideoTab = () => {
  const { animationName, scrollToTab, setAnimationName } = useWelcomeContext()

  // Get YouTube URL from environment variable
  const youtubeUrl = process.env.PLASMO_PUBLIC_YOUTUBE_URL || ""
  
  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)

    return match ? match[1] : ""
  }

  const videoId = getVideoId(youtubeUrl)
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : ""

  return (
    <motion.div
      {...ANIMATION_PROPS[animationName]}
      className="__vivid-container"
    >
      <Card className="w-full max-w-3xl text-center">
        <CardHeader className="space-y-2 pb-4">
          <h2 className="text-2xl font-semibold">
            Looks like you&apos;re new here!
          </h2>
          <p className="text-base text-muted-foreground">
            See how to utilize most of Vivid Tab
          </p>
        </CardHeader>
        <CardContent className="px-6">
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingBottom: VIDEO_ASPECT_RATIO_PADDING }}>
              <iframe
                src={embedUrl}
                title="How to use Vivid Tab"
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">
                Video not available
              </p>
            </div>
          )}
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
              scrollToTab("IMPORT")
              setAnimationName("rightToLeft")
            }}
            variant="secondary"
            size="sm"
            className="font-semibold"
          >
            NEXT
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export { YouTubeVideoTab }
