import { BACKGROUND_ACTIONS } from "./constants/background-actions"

/**
 * Handles background communication
 */
chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {
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

  case BACKGROUND_ACTIONS.GET_SEARCH_SUGGESTIONS: {
    console.log("Getting search suggestions for:", message.query)
    const results = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${message.query}`,
    )
    const data = await results.json()

    sendResponse(data[1])

    return true
  }}
})
