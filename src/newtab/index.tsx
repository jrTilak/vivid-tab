import Homepage from "@/components/common/homepage"
import { Settings } from "@/components/common/settings"
import { SettingsProvider } from "@/providers/settings-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import "@/styles/index.css"

function Index() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <Homepage />
        <Settings />
      </SettingsProvider>
    </ThemeProvider>
  )
}

export default Index