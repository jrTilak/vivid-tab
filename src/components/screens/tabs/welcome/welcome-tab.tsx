import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import icon from "data-base64:@/assets/icon.png"
import { ArrowRightIcon } from "lucide-react"
import { motion } from "motion/react"
import React from "react"
import { useWelcomeContext } from "./_context"
import { ANIMATION_PROPS } from "@/constants/animations"

const WelcomeTab = () => {
  const { animationName, scrollToTab, setAnimationName } = useWelcomeContext()

  return (
    <motion.div {...ANIMATION_PROPS[animationName]} className="__vivid-container">
      <Card className="text-center px-9 py-5 w-fit min-w-[512px] text-foreground">
        <CardContent className="space-y-6 pt-4">
          <img src={icon} alt="icon" className="size-20 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Hi, I&apos;m Vivid!</h2>
            <p className="text-base">
              I&apos;ll help you stay productive and motivated
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button
            onClick={() => {
              scrollToTab("IMPORT")
              setAnimationName("rightToLeft")
            }}
            variant="secondary"
            size="lg"
            className="font-semibold shadow-xl"
          >
            START <ArrowRightIcon className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export { WelcomeTab }
