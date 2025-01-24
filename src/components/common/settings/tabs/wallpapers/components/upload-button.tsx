import { Button } from "@/components/ui/button"
import { UploadIcon } from "lucide-react"

const UploadButton = ({ onUpload }: { onUpload: (file: File) => void }) => (
  <div className="relative w-full h-48">
    <Button
      variant="outline"
      className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground"
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <UploadIcon className="w-8 h-8 mb-2" />
      <span>Upload Image</span>
    </Button>
    <input
      id="fileInput"
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) onUpload(file)
      }}
    />
  </div>
)

export default UploadButton