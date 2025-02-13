import { ThemeProvider, type Theme } from "@/providers/theme-provider"
import React from "react"

import "@/styles/index.css"

type Props = {
  children: React.ReactNode
  theme?: Theme
}

const RootProvider = ({ children, theme }: Props) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

export default RootProvider
