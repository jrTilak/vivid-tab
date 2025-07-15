import { RootProvider } from "@/providers/root-provider"
import { WelcomeContextProvider } from "@/components/screens/tabs/welcome/_context"
import { Welcome } from "@/components/screens/tabs/welcome"

const WelcomeTab = () => {

  return (
    <RootProvider>
      <WelcomeContextProvider>
        <Welcome />
      </WelcomeContextProvider>
    </RootProvider>
  )
}

export default WelcomeTab
