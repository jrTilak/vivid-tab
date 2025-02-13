import WelcomeTab from "@/components/welcome"
import ImportFromBrowserBookmarks from "@/components/welcome/import-from-browser-bookmarks"
import ImportFromPreviousInstall from "@/components/welcome/import-from-previous-install"
import ImportTab from "@/components/welcome/import-tab"
import RootProvider from "@/providers/root-provider"
import background from "data-base64:@/assets/scene.jpg"
import React, { useEffect, useMemo, useRef, useState } from "react"

export type Tab =
  | "WELCOME"
  | "IMPORT"
  | "IMPORT_FROM_PREVIOUS_INSTALL"
  | "IMPORT_FROM_BROWSER_BOOKMARKS"

export const ANIMATIONS = {
  leftToRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    duration: 0.5
  },
  rightToLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    duration: 0.5
  }
}

export type Animation = keyof typeof ANIMATIONS

const Welcome = () => {
  const [currentTab, setCurrentTab] = useState<Tab>("WELCOME")
  const [animation, setAnimation] = useState<Animation>("leftToRight")
  const scrollToTab = (tab: Tab) => {
    setCurrentTab(tab)
  }

  const TABS = useMemo(
    () => ({
      WELCOME: (
        <WelcomeTab
          scrollToTab={scrollToTab}
          animation={animation}
          setAnimation={setAnimation}
        />
      ),
      IMPORT: (
        <ImportTab
          scrollToTab={scrollToTab}
          animation={animation}
          setAnimation={setAnimation}
        />
      ),
      IMPORT_FROM_PREVIOUS_INSTALL: (
        <ImportFromPreviousInstall
          scrollToTab={scrollToTab}
          animation={animation}
          setAnimation={setAnimation}
        />
      ),
      IMPORT_FROM_BROWSER_BOOKMARKS: (
        <ImportFromBrowserBookmarks
          scrollToTab={scrollToTab}
          animation={animation}
          setAnimation={setAnimation}
        />
      )
    }),
    [scrollToTab, animation]
  )

  return (
    <RootProvider theme="light">
      <main className="h-screen w-screen relative">
        <img
          src={background}
          alt="background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 h-screen w-screen backdrop-blur-sm bg-black/40 flex items-center justify-center">
          <div className="w-screen h-screen flex items-center justify-center">
            {TABS[currentTab]}
          </div>
        </div>
      </main>
    </RootProvider>
  )
}

export default Welcome
