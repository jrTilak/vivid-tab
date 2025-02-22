import React from "react"

import SearchDialog from "./components/searchbars/search-dialog"
import { SettingsProvider } from "./providers/settings-provider"

// Inject into the ShadowDOM
// export const getStyle = () => {
//   const style = document.createElement("style")
//   style.textContent = cssText

//   return style
// }

const Content = () => {
  return null

  return (
    <SettingsProvider>
      <SearchDialog isNewTab={false} />
    </SettingsProvider>
  )
}

export default Content
