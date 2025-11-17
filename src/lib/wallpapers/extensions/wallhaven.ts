import { randomInt } from "@/lib/random"
import type { ExternalImage, WallpaperExtension } from ".."

export class Wallhaven implements WallpaperExtension {
  sourceName = "wallhaven"

  async fetchImages(
    searchTerms?: string[],
    count = 10,
  ): Promise<ExternalImage[]> {
    // Pick a random keyword if searchTerms are provided
    let keyword: string | undefined

    if (searchTerms && searchTerms.length > 0) {
      keyword =
        searchTerms[randomInt(0, searchTerms.length - 1)] || searchTerms[0]
    }

    // Pick a random page 1-4
    const page = randomInt(1, 4)

    let images = await this._fetchImages(keyword, page)

    // Fallback to page 1 if no images
    if (!images || images.length === 0) {
      images = await this._fetchImages(keyword, 1)
      if (!images || images.length === 0) return []
    }

    // Return randomized slice
    const shuffled = images.sort(() => Math.random() - 0.5)

    return shuffled.slice(0, count) as ExternalImage[]
  }

  private async _fetchImages(searchTerm?: string, page = 1): Promise<string[]> {
    let url = `https://wallhaven.cc/api/v1/search?page=${page}&resolutions=1920x1080&sorting=random`
    if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`

    try {
      const res = await fetch(url)
      if (!res.ok) return []

      const data = await res.json()
      const wallpapers = data.data || []

      if (!wallpapers.length) return []

      // Extract image URLs (use .path for full-res wallpaper)
      return wallpapers.map((w: { path: string }) => w.path)
    } catch (e) {
      console.error("Wallhaven fetch error:", e)

      return []
    }
  }
}
