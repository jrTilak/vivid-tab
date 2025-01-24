import { Badge } from "@/components/ui/badge";
import type { SettingsConfig } from "@/types/setting-types";
import type { ImageData } from "..";

const ImageCard = ({
  image,
  isSelected,
  onSelect,
}: { image: ImageData; isSelected: boolean; onSelect: () => void }) => (
  <button
    // disabled={isSelected}
    role="button" className="relative group" onClick={onSelect}>
    <img
      src={image.src}
      width={200}
      height={200}
      className="w-full h-48 object-cover rounded-lg transition-transform group-disabled:group-hover:scale-100 group-hover:scale-105 brightness-75"
    />
    {isSelected && <Badge className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" variant="secondary">Selected</Badge>}
  </button>
)

export default ImageCard