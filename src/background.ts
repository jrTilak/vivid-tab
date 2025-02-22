import { BACKGROUND_ACTIONS } from "./constants/background-actions"

/**
 * Handles background communication
 */
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.action) {
    case BACKGROUND_ACTIONS.GET_BOOKMARKS:
      chrome.bookmarks.getTree((bookmarkTree) => {
        sendResponse(bookmarkTree)
      })

      return true
    case BACKGROUND_ACTIONS.GET_HISTORY:
      chrome.history.search({ text: "" }, (historyItems) => {
        sendResponse(historyItems?.slice(0, 30) || [])
      })

      return true
  }
})
