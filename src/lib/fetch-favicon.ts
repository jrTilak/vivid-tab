/**
 *  Fetches favicon of a specific website
 */
const fetchFavicon = async (url: string) => {
  try {
    const response = await fetch(url)
    const html = await response.text()

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    // Get the title from the document

    // Try to find the best-quality favicon
    let favicon =
      doc.querySelector("link[rel='icon'][sizes]")?.getAttribute("href") || // Check for explicit sizes
      doc.querySelector("link[rel~='icon']")?.getAttribute("href") || // Check for standard rel=icon
      doc.querySelector("link[rel='apple-touch-icon']")?.getAttribute("href") || // Check for Apple Touch icons
      doc.querySelector("link[rel='shortcut icon']")?.getAttribute("href") // Check for shortcut icons

    // Convert relative favicon URLs to absolute URLs
    if (favicon && !favicon.startsWith("http")) {
      const baseUrl = new URL(url)
      favicon = new URL(favicon, baseUrl).href
    }

    // Fallback to Google Favicon API for high-quality favicons
    if (!favicon) {
      favicon = `https://www.google.com/s2/favicons?sz=64&domain_url=${new URL(url).origin}`
    }

    return { favicon }
  } catch {
    return { title: null, favicon: null }
  }
}

export { fetchFavicon }
