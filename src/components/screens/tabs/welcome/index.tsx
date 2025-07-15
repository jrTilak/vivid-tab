import { WelcomeTab } from './welcome-tab'
import { ImportTab } from './import-tab'
import { CreateNewBookmarkFolder } from './create-new-bookmark-folder'
import { ImportFromBrowserBookmarks } from './import-from-browser-bookmarks'
import background from "data-base64:@/assets/scene.jpg"
import { useWelcomeContext } from './_context'

const TABS = {
  WELCOME: WelcomeTab,
  IMPORT: ImportTab,
  CREATE_NEW_BOOKMARK_FOLDER: CreateNewBookmarkFolder,
  IMPORT_FROM_BROWSER_BOOKMARKS: ImportFromBrowserBookmarks,
} as const

const Welcome = () => {
  const { currentTab } = useWelcomeContext()

  return (
    <main className="h-screen w-screen relative">
      <img
        src={background}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 h-screen w-screen backdrop-blur-md bg-black/20 flex items-center justify-center">
        <div className="w-screen h-screen flex items-center justify-center">
          {(() => {
            const Comp = TABS[currentTab]

            return (
              <Comp />
            )
          })()}
        </div>
      </div>
    </main>
  )
}

export { Welcome }