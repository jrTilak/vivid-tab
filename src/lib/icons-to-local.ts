type SaveProps = {
  key: string
  value: {
    icon: string
    expiry?: number
  }
}

/**
 * Saves an icon and its metadata to Chrome's local storage
 * Params: key (string) - unique identifier, value (object) - icon data and optional expiry
 */
export const saveIconsToLocalStorage = ({ key, value }: SaveProps) => {
  chrome.storage.local.set({ [key]: value })
}

/**
 * Removes an icon from Chrome's local storage by its key
 * Params: key (string) - unique identifier of the icon to remove
 */
export const removeIconFromLocalStorage = (key: string) => {
  chrome.storage.local.remove(key)
}

/**
 * Retrieves an icon from Chrome's local storage
 * Params: key (string) - unique identifier of the icon
 */
export const getIconFromLocalStorage = <T>(
  key: string,
): Promise<Record<string, T>> => {
  return chrome.storage.local.get(key)
}
