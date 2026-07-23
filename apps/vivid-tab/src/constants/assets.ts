import claudeIconUrl from "raw:/assets/claude.png";
import driveIconUrl from "raw:/assets/drive.png";
import gmailIconUrl from "raw:/assets/gmail.png";
import linkedinIconUrl from "raw:/assets/linkedin.png";
import notionIconUrl from "raw:/assets/notion-light.png";
import openaiIconUrl from "raw:/assets/openai.png";
import whatsappIconUrl from "raw:/assets/whatsapp.png";
import xIconUrl from "raw:/assets/x.png";
import xTwitterIconUrl from "raw:/assets/x-twitter-light.png";
import youtubeIconUrl from "raw:/assets/youtube.png";

/**
 * Packaged URLs for the application shortcuts rendered by the new-tab search.
 */
export const POPULAR_APP_ASSETS = {
	drive: driveIconUrl,
	gmail: gmailIconUrl,
	linkedin: linkedinIconUrl,
	notion: notionIconUrl,
	openai: openaiIconUrl,
	whatsapp: whatsappIconUrl,
	x: xTwitterIconUrl,
	youtube: youtubeIconUrl,
} as const;

const ASSET_URL_BY_LOGICAL_PATH = new Map<string, string>([
	["assets/claude.png", claudeIconUrl],
	["assets/drive.png", driveIconUrl],
	["assets/gmail.png", gmailIconUrl],
	["assets/linkedin.png", linkedinIconUrl],
	["assets/openai.png", openaiIconUrl],
	["assets/x.png", xIconUrl],
	["assets/youtube.png", youtubeIconUrl],
]);

/**
 * Resolves logical paths stored in generated data to their packaged URLs.
 * Unknown paths intentionally return `undefined` so callers can use text
 * fallbacks instead of constructing a URL to a missing production asset.
 */
export const getBundledAssetUrl = (
	logicalPath: string | undefined,
): string | undefined =>
	logicalPath ? ASSET_URL_BY_LOGICAL_PATH.get(logicalPath) : undefined;
