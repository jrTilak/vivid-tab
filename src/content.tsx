import React, { useRef } from "react"

import { SettingsProvider } from "./providers/settings-provider"
import styleText from "data-text:@/styles/index.css"
import SearchDialog from "./components/common/search-dialog"

// Inject into the ShadowDOM
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText

  return style
}

const Content = () => {
  const portalRef = useRef<HTMLDivElement>(null)

  return (
    <SettingsProvider>
      <div className="__vivid-container">
        <div
          className="antialiased bg-background text-foreground font-bricolage-grotesque min-h-screen min-w-screen"
          ref={portalRef}
        ></div>
      </div>
      <SearchDialog isNewTab={false} portalRef={portalRef} />
    </SettingsProvider>
  )
}

export default Content
