import { POPULAR_APP_ASSETS } from "@/constants/assets";

type PopularApp = {
	icon: string;
	title: string;
	url: string;
};

export const POPULAR_APPS = [
	{
		title: "ChatGPT",
		url: "https://chatgpt.com/",
		icon: POPULAR_APP_ASSETS.openai,
	},
	{
		title: "Notion",
		url: "https://www.notion.so/",
		icon: POPULAR_APP_ASSETS.notion,
	},
	{
		title: "X (Twitter)",
		url: "https://x.com/",
		icon: POPULAR_APP_ASSETS.x,
	},
	{
		title: "WhatsApp",
		url: "https://web.whatsapp.com/",
		icon: POPULAR_APP_ASSETS.whatsapp,
	},
	{
		title: "LinkedIn",
		url: "https://www.linkedin.com/",
		icon: POPULAR_APP_ASSETS.linkedin,
	},
	{
		title: "Gmail",
		url: "https://mail.google.com/mail/",
		icon: POPULAR_APP_ASSETS.gmail,
	},
	{
		title: "YouTube",
		url: "https://www.youtube.com/",
		icon: POPULAR_APP_ASSETS.youtube,
	},
	{
		title: "Drive",
		url: "https://drive.google.com/",
		icon: POPULAR_APP_ASSETS.drive,
	},
] as const satisfies ReadonlyArray<PopularApp>;
