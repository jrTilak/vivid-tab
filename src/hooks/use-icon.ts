import { useState } from "react"
import useAsyncEffect from "./use-async-effect"
import { getIconFromLocalStorage } from "@/lib/icons-to-local"

type Props = {
  id: string
  defaultIcon?: string
}

const useIcon = (props: Props) => {
  const [icon, setIcon] = useState(props.defaultIcon || "")

  useAsyncEffect(async () => {
    const key = `icon-${props.id}`
    const icon = await getIconFromLocalStorage<{ icon: string }>(key)

    if (icon?.[key]?.icon) {
      setIcon(icon[key].icon)
    }
  }, [props.id])

  return { icon, setIcon }
}

export default useIcon
