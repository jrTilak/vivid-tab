import { DEFAULT_SETTINGS } from "@/constants/settings"
import { z } from "zod"

/**
 * Zod schema to parse settings
 */
export const SettingsSchema = z
  .object({
    timer: z
      .object({
        timeFormat: z
          .enum(["12h", "24h"])
          .default(DEFAULT_SETTINGS.timer.timeFormat),
        showSeconds: z.boolean().default(DEFAULT_SETTINGS.timer.showSeconds),
      })
      .default(DEFAULT_SETTINGS.timer),
    temperature: z
      .object({
        unit: z
          .enum(["celsius", "fahrenheit"])
          .default(DEFAULT_SETTINGS.temperature.unit),
      })
      .default(DEFAULT_SETTINGS.temperature),
    quotes: z
      .object({
        categories: z
          .array(z.string())
          .default(DEFAULT_SETTINGS.quotes.categories),
      })
      .default(DEFAULT_SETTINGS.quotes),
    todos: z
      .object({
        expireAfterCompleted: z
          .object({
            enabled: z
              .boolean()
              .default(DEFAULT_SETTINGS.todos.expireAfterCompleted.enabled),
            durationInMinutes: z
              .number()
              .default(
                DEFAULT_SETTINGS.todos.expireAfterCompleted.durationInMinutes,
              ),
          })
          .default(DEFAULT_SETTINGS.todos.expireAfterCompleted),
      })
      .default(DEFAULT_SETTINGS.todos),
    wallpapers: z
      .object({
        selectedImageId: z
          .string()
          .default(DEFAULT_SETTINGS.wallpapers.selectedImageId)
          .nullable()
          .nullish(),
        images: z.array(z.string()).default(DEFAULT_SETTINGS.wallpapers.images),
      })
      .default(DEFAULT_SETTINGS.wallpapers),
    layout: z.record(z.string(), z.string()).default(DEFAULT_SETTINGS.layout),
    general: z
      .object({
        rootFolder: z.string().default(DEFAULT_SETTINGS.general.rootFolder),
        showHistory: z.boolean().default(DEFAULT_SETTINGS.general.showHistory),
        layout: z
          .enum(["grid", "list"])
          .default(DEFAULT_SETTINGS.general.layout),
        openUrlIn: z
          .enum(["new-tab", "current-tab"])
          .default(DEFAULT_SETTINGS.general.openUrlIn),
        bookmarksCanTakeExtraSpaceIfAvailable: z
          .boolean()
          .default(
            DEFAULT_SETTINGS.general.bookmarksCanTakeExtraSpaceIfAvailable,
          ),
      })
      .default(DEFAULT_SETTINGS.general),

    searchbar: z
      .object({
        dialogBackground: z
          .enum(["default", "transparent"])
          .default(DEFAULT_SETTINGS.searchbar.dialogBackground),
        shortcuts: z
          .array(z.enum(["chatgpt", "gemini", "deepseek", "claude", "youtube"]))
          .default(() => [...DEFAULT_SETTINGS.searchbar.shortcuts]),
        submitDefaultAction: z
          .enum(["default", "ask-chatgpt", "ask-claude", "search-on-youtube"])
          .default(DEFAULT_SETTINGS.searchbar.submitDefaultAction),
        searchSuggestions: z
          .boolean()
          .default(DEFAULT_SETTINGS.searchbar.searchSuggestions),
        historySuggestions: z
          .boolean()
          .default(DEFAULT_SETTINGS.searchbar.historySuggestions),
        bookmarkSuggestions: z
          .boolean()
          .default(DEFAULT_SETTINGS.searchbar.bookmarkSuggestions),
        searchbarAutoComplete: z
          .boolean()
          .default(DEFAULT_SETTINGS.searchbar.searchbarAutoComplete),
        openResultInFromNewTab: z
          .enum(["new-tab", "current-tab"])
          .default(DEFAULT_SETTINGS.searchbar.openResultInFromNewTab),
        openResultInFromWebPage: z
          .enum(["new-tab", "current-tab"])
          .default(DEFAULT_SETTINGS.searchbar.openResultInFromWebPage),
      })
      .default({}),
  })
  .default({})

export type Settings = z.infer<typeof SettingsSchema>
