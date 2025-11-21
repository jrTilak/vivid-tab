export type BrowserType = "chrome" | "firefox" | "unknown"

export const detectBrowser = (): BrowserType => {
  const userAgent = navigator.userAgent.toLowerCase()

  // Check for Firefox first
  if (userAgent.includes("firefox")) {
    return "firefox"
  }

  // Check for Chrome/Chromium (but not Edge which also contains "chrome")
  if (
    (userAgent.includes("chrome") || userAgent.includes("chromium")) &&
    !userAgent.includes("edg")
  ) {
    return "chrome"
  }

  return "unknown"
}

export const getBrowserStoreUrl = (): string => {
  const browser = detectBrowser()

  if (browser === "firefox") {
    return "https://addons.mozilla.org/firefox/addon/vivid-tab/"
  }

  // Default to Chrome Web Store
  return "https://chrome.google.com/webstore/detail/vivid-tab/hchlkclbagoklpnijoadpghhcjpeoeim"
}

export const getFeedbackFormUrl = (): string => {
  return "https://github.com/jrTilak/vivid-tab/issues/new"
}
