import cssText from "data-text:@/styles/index.css"
import React from "react"

import SearchDialog from "./components/searchbars/search-dialog"
import { SettingsProvider } from "./providers/settings-provider"
import { ThemeProvider } from "./providers/theme-provider"

// Inject into the ShadowDOM
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const Content = () => {
  return (
    <SettingsProvider>
      <SearchDialog />
    </SettingsProvider>
  )
}

export default Content
