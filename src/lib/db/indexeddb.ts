/**
 * Opens the ImageDB IndexedDB database and ensures the "images" object store exists
 * @param version The version number for the database
 * @returns Promise that resolves with the database instance
 */
export function openImageDB(version = 1): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ImageDB", version)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"))
    }
  })
}
