import Homepage from "@/components/homepage"

import { Settings } from "./components/settings"
import RootProvider from "./providers/root-provider"

function Index() {
  return (
    <RootProvider>
      <Homepage />
      <Settings />
    </RootProvider>
  )
}

export default Index
