import WelcomeTab from "@/components/welcome"
import CreateNewBookmarkFolder from "@/components/welcome/create-new-bookmark-folder"
import ImportFromBrowserBookmarks from "@/components/welcome/import-from-browser-bookmarks"
import ImportTab from "@/components/welcome/import-tab"
import RootProvider from "@/providers/root-provider"
import background from "data-base64:@/assets/scene.jpg"
import React, { useState } from "react"

export const ANIMATIONS = {
  leftToRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    duration: 0.5,
  },
  rightToLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
    duration: 0.5,
  },
}

export type Animation = keyof typeof ANIMATIONS

const TABS = {
  WELCOME: WelcomeTab,
  IMPORT: ImportTab,
  CREATE_NEW_BOOKMARK_FOLDER: CreateNewBookmarkFolder,
  IMPORT_FROM_BROWSER_BOOKMARKS: ImportFromBrowserBookmarks,
} as const

export type TabName = keyof typeof TABS

const Welcome = () => {
  const [currentTab, setCurrentTab] = useState<TabName>("WELCOME")
  const [animation, setAnimation] = useState<Animation>("leftToRight")

  const scrollToTab = (tab: TabName) => {
    setCurrentTab(tab)
  }

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
            {(() => {
              const Comp = TABS[currentTab]

              return (
                <Comp
                  scrollToTab={scrollToTab}
                  animation={animation}
                  setAnimation={setAnimation}
                />
              )
            })()}
          </div>
        </div>
      </main>
    </RootProvider>
  )
}

export default Welcome
