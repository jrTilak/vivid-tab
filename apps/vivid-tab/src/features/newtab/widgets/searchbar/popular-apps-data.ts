type PopularApp = {
	icon: string;
	title: string;
	url: string;
};

export const POPULAR_APPS = [
	{
		title: "ChatGPT",
		url: "https://chatgpt.com/",
		icon: "assets/openai.png",
	},
	{
		title: "Notion",
		url: "https://www.notion.so/",
		icon: "assets/notion-light.png",
	},
	{
		title: "X (Twitter)",
		url: "https://x.com/",
		icon: "assets/x-twitter-light.png",
	},
	{
		title: "WhatsApp",
		url: "https://web.whatsapp.com/",
		icon: "assets/whatsapp.png",
	},
	{
		title: "LinkedIn",
		url: "https://www.linkedin.com/",
		icon: "assets/linkedin.png",
	},
	{
		title: "Gmail",
		url: "https://mail.google.com/mail/",
		icon: "assets/gmail.png",
	},
	{
		title: "YouTube",
		url: "https://www.youtube.com/",
		icon: "assets/youtube.png",
	},
	{
		title: "Drive",
		url: "https://drive.google.com/",
		icon: "assets/drive.png",
	},
] as const satisfies ReadonlyArray<PopularApp>;
