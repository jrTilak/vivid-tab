import { ThemeProvider, type Theme } from "@/providers/theme-provider"
import React, { useEffect } from "react"

import "@/styles/index.css"

import { SettingsProvider } from "./settings-provider"

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
