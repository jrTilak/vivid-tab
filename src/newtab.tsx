import Homepage from "@/components/homepage"
import bmc from "data-base64:@/assets/bmc-logo-yellow.png"
import { Settings } from "./components/settings"
import RootProvider from "./providers/root-provider"

function Index() {
  return (
    <RootProvider>
      <Homepage />
      <div className="flex items-center justify-center gap-4 fixed top-4 right-4">
        <a
          target="_blank"
          href="https://buymeacoffee.com/jrtilak"
          rel="noreferrer"
        >
          <img
            src={bmc}
            alt="Buy Me A Coffee"
            className="size-5 rounded-full"
          />
        </a>
        <Settings />
      </div>
    </RootProvider>
  )
}

export default Index
