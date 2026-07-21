import { QUOTE_CATEGORIES, QUOTES } from "./catalog.generated";

export { QUOTE_CATEGORIES, QUOTES };

export type QuoteCategory = (typeof QUOTE_CATEGORIES)[number];
export type QuoteCategorySlug = QuoteCategory["slug"];
export type LocalQuote = (typeof QUOTES)[number];
