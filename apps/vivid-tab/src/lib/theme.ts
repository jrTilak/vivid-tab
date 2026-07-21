/** Dark palette identifiers shared by settings, CSS, and development overrides. */
export const THEMES = ["dark", "catppuccin-mocha", "tokyo-night"] as const;

export type Theme = (typeof THEMES)[number];
