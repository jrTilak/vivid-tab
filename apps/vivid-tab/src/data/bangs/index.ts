import { BANGS as GENERATED_BANGS } from "./catalog.generated";

export type BangFormatFlag =
	| "open_base_path"
	| "open_snap_domain"
	| "url_encode_placeholder"
	| "url_encode_space_to_plus";

/** Minimal bang data kept in the extension bundle. */
export type LocalBang = {
	readonly domain: string;
	readonly format?: readonly BangFormatFlag[];
	readonly icon?: string;
	readonly name: string;
	readonly snapDomain?: string;
	readonly template: string;
	readonly triggers: readonly string[];
};

export const BANGS: readonly LocalBang[] = GENERATED_BANGS;
