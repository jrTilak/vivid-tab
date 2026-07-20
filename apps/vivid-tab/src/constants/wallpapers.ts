export const DEFAULT_WALLHAVEN_SEARCH_TERMS = [
	"anime",
	"superhero",
	"comics",
] as const;

export const DEFAULT_WALLHAVEN_KEYWORDS =
	DEFAULT_WALLHAVEN_SEARCH_TERMS.join(", ");
