export const BACKGROUND_ACTIONS = {
  GET_BOOKMARKS: "GET_BOOKMARKS",
  GET_HISTORY: "GET_HISTORY",
  SEARCH_QUERY: "SEARCH_QUERY",
}

export type BackgroundAction = keyof typeof BACKGROUND_ACTIONS
