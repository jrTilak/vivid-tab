import { ThemeProvider, type Theme } from "@/providers/theme-provider"
import React, { useEffect } from "react"

import { SettingsProvider } from "./settings-provider"

// if (process.env.NODE_ENV === "development") {
//   // eslint-disable-next-line @typescript-eslint/no-require-imports
//   require("@/styles/index.css")
// }

// give error in production : Segmentation fault: core dumped but works fine
import "@/styles/index.css"

type Props = {
  children: React.ReactNode
  theme?: Theme
}

const RootProvider = ({ children, theme }: Props) => {
  useEffect(() => {
    document.querySelector("html").classList.add("__vivid-container")
  }, [])

  return (
    <SettingsProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </SettingsProvider>
  )
}

export default RootProvider
