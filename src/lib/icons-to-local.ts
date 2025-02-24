type SaveProps = {
  key: string
  value: {
    icon: string
    expiry?: number
  }
}

export const saveIconsToLocalStorage = ({ key, value }: SaveProps) => {
  chrome.storage.local.set({ [key]: value })
}

export const removeIconFromLocalStorage = (key: string) => {
  chrome.storage.local.remove(key)
}

export const getIconFromLocalStorage = <T>(
  key: string,
): Promise<Record<string, T>> => {
  return chrome.storage.local.get(key)
}
