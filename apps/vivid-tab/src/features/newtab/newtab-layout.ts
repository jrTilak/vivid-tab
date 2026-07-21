export type NewtabLayout = Partial<Record<string, string>>;
export type NewtabLayoutType = "large" | "mid" | "small";

const LEFT_COLUMN_SLOTS = ["1", "2", "3"] as const;
const RIGHT_COLUMN_SLOTS = ["5", "6", "7"] as const;

const hasLayoutWidget = (layout: NewtabLayout, slots: readonly string[]) =>
	slots.some((slot) => Boolean(layout[slot]));

/** Derives the bookmark column width without a render-delaying effect. */
export const getNewtabLayoutType = (
	layout: NewtabLayout,
	allowExtraBookmarkSpace: boolean,
): NewtabLayoutType => {
	if (!allowExtraBookmarkSpace) return "small";

	const hasLeftColumn = hasLayoutWidget(layout, LEFT_COLUMN_SLOTS);
	const hasRightColumn = hasLayoutWidget(layout, RIGHT_COLUMN_SLOTS);

	if (hasLeftColumn && hasRightColumn) return "small";
	if (hasLeftColumn || hasRightColumn) return "mid";

	return "large";
};

export const hasLeftLayoutColumn = (layout: NewtabLayout) =>
	hasLayoutWidget(layout, LEFT_COLUMN_SLOTS);

export const hasRightLayoutColumn = (layout: NewtabLayout) =>
	hasLayoutWidget(layout, RIGHT_COLUMN_SLOTS);
