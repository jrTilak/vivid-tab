import Homepage from "@/components/screens/newtab"
import { Settings } from "./components/screens/newtab/settings"
import { RootProvider } from "./providers/root-provider"

function NewtabPage() {
  return (
    <RootProvider>
      <Homepage />
      <div className="flex items-center justify-center gap-4 fixed top-4 right-4">
        <Settings />
      </div>
    </RootProvider>
  )
}

export default NewtabPage
