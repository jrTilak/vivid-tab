import * as z from "zod/mini";
import {
	MAX_TODO_EXPIRATION_MINUTES,
	SETTINGS_VERSION,
} from "@/constants/settings";
import { THEMES } from "@/lib/theme";

const LayoutSlotSchema = z.enum(["0", "1", "2", "3", "4", "5", "6", "7", "8"]);
const WidgetIdSchema = z.enum([
	"bookmarks",
	"clock",
	"notes",
	"quotes",
	"searchbar",
	"todos",
	"weather",
]);
const WidgetLayoutSchema = z
	.partialRecord(LayoutSlotSchema, WidgetIdSchema)
	.check(
		z.refine((layout) => {
			const entries = Object.entries(layout);
			const widgets = entries.map(([, widget]) => widget);
			if (new Set(widgets).size !== widgets.length) return false;

			return entries.every(([slot, widget]) => {
				if (widget === "bookmarks") return slot === "4";
				if (widget === "searchbar") return slot === "0" || slot === "8";

				return ["1", "2", "3", "5", "6", "7"].includes(slot);
			});
		}, "Widget layout contains duplicate or invalid positions"),
	);

/**
 * The complete runtime shape of Vivid Tab settings.
 *
 * Defaults intentionally live outside this schema. Persisted settings are merged
 * with the current defaults before validation, which keeps migrations explicit
 * and avoids repeating defaults at every schema level.
 */
export const SettingsSchema = z.object({
	version: z.literal(SETTINGS_VERSION),
	general: z.object({
		rootFolder: z.string(),
		showHistory: z.boolean(),
		showTopSites: z.boolean(),
		layout: z.enum(["grid", "list"]),
		openUrlIn: z.enum(["new-tab", "current-tab"]),
		bookmarksCanTakeExtraSpaceIfAvailable: z.boolean(),
	}),
	widgets: z.object({
		timer: z.object({
			timeFormat: z.enum(["12h", "24h"]),
			showSeconds: z.boolean(),
		}),
		temperature: z.object({
			unit: z.enum(["celsius", "fahrenheit"]),
		}),
		quotes: z.object({
			categories: z.array(z.string()),
		}),
		todos: z.object({
			expireAfterCompleted: z.object({
				enabled: z.boolean(),
				durationInMinutes: z
					.number()
					.check(z.minimum(0), z.maximum(MAX_TODO_EXPIRATION_MINUTES)),
			}),
		}),
		layout: WidgetLayoutSchema,
		searchbar: z.object({
			searchSuggestions: z.boolean(),
		}),
	}),
	appearance: z.object({
		radius: z.enum(["rounded", "none", "sm"]),
		theme: z.enum(THEMES),
		visualEffect: z.enum(["opaque", "translucent"]),
		wallpapers: z.object({
			selectedImageId: z.nullable(z.string()),
			images: z.array(z.string()),
			bookmarkedImageIds: z.array(z.string()),
			onlineImages: z.object({
				enabled: z.boolean(),
				keywords: z.string(),
			}),
		}),
		background: z.object({
			blurIntensity: z.number().check(z.minimum(0), z.maximum(10)),
			brightness: z.number().check(z.minimum(0), z.maximum(10)),
			randomizeWallpaper: z.enum(["off", "on-each-tab", "hourly", "daily"]),
		}),
	}),
});

export type Settings = z.infer<typeof SettingsSchema>;
