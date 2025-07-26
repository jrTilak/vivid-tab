import type { Animation } from "@/constants/animations"
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import type { TabName } from "."

type WelcomeContextType = {
  currentTab: TabName
  animationName: Animation
  scrollToTab: (tab: TabName) => void
  setAnimationName: (animation: Animation) => void
}

const WelcomeContext = createContext<null | WelcomeContextType>(null)

const WelcomeContextProvider = ({ children }: { children: ReactNode }) => {
  const [animationName, setAnimationName] = useState<Animation>("leftToRight")
  const [currentTab, setCurrentTab] = useState<TabName>("WELCOME")

  const scrollToTab = useCallback((tab: TabName) => {
    setCurrentTab(tab)
  }, [])

  return (
    <WelcomeContext.Provider
      value={{
        animationName,
        currentTab,
        scrollToTab,
        setAnimationName,
      }}
    >
      {children}
    </WelcomeContext.Provider>
  )
}

const useWelcomeContext = () => {
  const context = useContext(WelcomeContext)

  if (!context) {
    throw new Error(
      "useWelcomeContext must be used within a WelcomeContextProvider",
    )
  }

  return context
}

export { useWelcomeContext, WelcomeContextProvider }
