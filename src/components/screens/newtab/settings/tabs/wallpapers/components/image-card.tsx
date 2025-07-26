import { Badge } from "@/components/ui/badge"
import { useImage } from "@/hooks/use-image"
import { useSettings } from "@/providers/settings-provider"
import defaultImage from "data-base64:@/assets/scene.jpg"
import { TrashIcon } from "lucide-react"

const ImageCard = ({
  imageId,
  isSelected,
  onSelect,
}: {
  imageId: string | null
  isSelected: boolean
  onSelect: () => void
}) => {
  const imageSrc = useImage(imageId)
  const { setSettings } = useSettings()

  const deleteImageById = (imageId: string) => {
    const request = indexedDB.open("ImageDB", 1)

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const transaction = db.transaction("images", "readwrite")
      const store = transaction.objectStore("images")

      const deleteRequest = store.delete(imageId)

      deleteRequest.onsuccess = () => {
        console.log(`Image with ID ${imageId} deleted successfully.`)
        setSettings((prev) => ({
          ...prev,
          wallpapers: {
            ...prev.wallpapers,
            images: prev.wallpapers.images.filter((id) => id !== imageId),
            selectedImageId:
              prev.wallpapers.selectedImageId === imageId
                ? null
                : prev.wallpapers.selectedImageId,
          },
        }))
      }

      deleteRequest.onerror = () => {
        console.error(`Failed to delete image with ID ${imageId}`)
      }
    }

    request.onerror = () => {
      console.error("Failed to open IndexedDB")
    }
  }

  return (
    <div
      role="button"
      className="relative group"
      onClick={isSelected ? null : onSelect}
    >
      <img
        src={imageId === null ? defaultImage : imageSrc}
        width={200}
        height={200}
        className="w-full h-48 object-cover rounded-lg transition-transform group-disabled:group-hover:scale-100 group-hover:scale-105 brightness-75"
      />
      {isSelected && (
        <Badge
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          variant="secondary"
        >
          Selected
        </Badge>
      )}
      {imageId !== null && (
        <button
          className="absolute top-0 right-0 text-destructive scale-0 group-hover:scale-100 transition-transform"
          onClick={() => deleteImageById(imageId)}
        >
          <TrashIcon className="size-4 text-red-500" />
        </button>
      )}
    </div>
  )
}

export default ImageCard
