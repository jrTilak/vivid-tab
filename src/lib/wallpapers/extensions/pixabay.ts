import { randomInt } from "@/lib/random"
import type { ExternalImage, WallpaperExtension } from ".."

export class Pixabay implements WallpaperExtension {
  sourceName = "pixabay"
  private _apiKey: string

  constructor() {
    this._apiKey = process.env.PLASMO_PUBLIC_PIXABAY_API_KEY || ""
  }

  async fetchImages(
    searchTerms?: string[],
    count = 10,
  ): Promise<ExternalImage[]> {
    if (!this._apiKey) return []

    // Pick a random keyword if searchTerms are provided
    let keyword: string | undefined

    if (searchTerms && searchTerms.length > 0) {
      keyword =
        searchTerms[randomInt(0, searchTerms.length - 1)] || searchTerms[0]
    }

    // Pick a random page 1-4
    const page = randomInt(1, 4)

    let images = await this._fetchImage(keyword, page)

    // Fallback to page 1 if no images
    if (!images || images.length === 0) {
      images = await this._fetchImage(keyword, 1)
      if (!images || images.length === 0) return []
    }

    // Return randomized slice
    const shuffled = images.sort(() => Math.random() - 0.5)

    return shuffled.slice(0, count) as ExternalImage[]
  }

  private async _fetchImage(searchTerm?: string, page = 1): Promise<string[]> {
    let url = `https://pixabay.com/api/?key=${this._apiKey}&image_type=photo&orientation=horizontal&min_width=800&min_height=800&order=popular&per_page=50&page=${page}`
    if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`

    try {
      const res = await fetch(url)
      if (!res.ok) return []

      const data = await res.json()
      const hits = data.hits || []

      if (!hits.length) return []

      return hits.map((h: { webformatURL: string }) => h.webformatURL)
    } catch (e) {
      console.error("Pixabay fetch error:", e)

      return []
    }
  }
}
