export type BrowserType = "chrome" | "firefox" | "unknown"

export const detectBrowser = (): BrowserType => {
  if (typeof chrome !== "undefined" && chrome.runtime) {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes("firefox")) {
      return "firefox"
    }

    if (userAgent.includes("chrome") || userAgent.includes("chromium")) {
      return "chrome"
    }
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
