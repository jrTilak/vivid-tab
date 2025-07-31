interface PixabayImage {
  id: number
  webformatURL: string
  user: string
  tags: string
}

interface PixabayResponse {
  hits: PixabayImage[]
  total: number
  totalHits: number
}

/**
 * Fetches images from Pixabay API
 */
export async function fetchPixabayImages(
  keywords: string = "",
  count: number = 10,
): Promise<PixabayImage[]> {
  try {
    // Get API key from environment or chrome storage
    const apiKey = process.env.PIXABAY_API_KEY || ""
    
    if (!apiKey) {
      console.warn("Pixabay API key not found")
      
return []
    }

    const searchTerm = keywords.split(",").map(k => k.trim()).join("+") || "nature"
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(searchTerm)}&image_type=photo&orientation=all&category=backgrounds&min_width=1920&min_height=1080&per_page=${count}&safesearch=true`

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`)
    }

    const data: PixabayResponse = await response.json()
    
return data.hits || []
  } catch (error) {
    console.error("Error fetching Pixabay images:", error)
    
return []
  }
}

/**
 * Downloads an image and converts it to base64
 */
export async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to convert image to base64"))
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error downloading image:", error)
    
return null
  }
}

/**
 * Stores a Pixabay image in IndexedDB
 */
export async function storePixabayImage(
  imageUrl: string,
  pixabayId: number,
  tags: string,
  user: string,
): Promise<string | null> {
  try {
    const base64Image = await downloadImageAsBase64(imageUrl)
    
    if (!base64Image) {
      return null
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ImageDB", 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "id" })
        }
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction("images", "readwrite")
        const store = transaction.objectStore("images")

        const imageId = `pixabay_${pixabayId}_${Date.now()}`
        const imageObject = {
          id: imageId,
          src: base64Image,
          source: "pixabay",
          pixabayId,
          tags,
          user,
          fetchedAt: Date.now(),
        }

        store.put(imageObject)
        
        transaction.oncomplete = () => {
          console.log("Pixabay image stored with ID:", imageId)
          resolve(imageId)
        }
        
        transaction.onerror = () => {
          reject(new Error("Failed to store image in IndexedDB"))
        }
      }

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"))
      }
    })
  } catch (error) {
    console.error("Error storing Pixabay image:", error)
    
return null
  }
}