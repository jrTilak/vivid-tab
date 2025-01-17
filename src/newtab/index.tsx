import { Settings } from "@/components/common/settings"
import Minimal from "@/components/styles/minimal"
import { SettingsProvider } from "@/providers/settings-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import "@/styles/index.css"

function Index() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <Minimal />
        <Settings />
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default Index