import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ANIMATIONS, type Animation, type TabName } from "@/tabs/welcome"
import icon from "data-base64:@/assets/icon.png"
import { ArrowRightIcon } from "lucide-react"
import { motion } from "motion/react"
import React from "react"

export type Props = {
  scrollToTab: (tab: TabName) => void
  animation: Animation
  setAnimation: (animation: Animation) => void
}

const WelcomeTab = ({ scrollToTab, animation, setAnimation }: Props) => {
  return (
    <motion.div {...ANIMATIONS[animation]} className="__vivid-container">
      <Card className="bg-background text-center px-9 py-5 w-fit min-w-[512px]">
        <CardContent className="space-y-6 pt-4">
          <img src={icon} alt="icon" className="size-20 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Hi, I&apos;m Vivid!</h2>
            <p className="text-muted-foreground text-base">
              I&apos;ll help you stay productive and motivated
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button
            onClick={() => {
              scrollToTab("IMPORT")
              setAnimation("rightToLeft")
            }}
            variant="outline"
            size="lg"
            className="font-semibold"
          >
            START <ArrowRightIcon className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default WelcomeTab
