import { LayoutGridIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useSettings } from "@/providers/settings-provider";

const POPULAR_APPS = [
	{
		title: "ChatGPT",
		url: "https://chatgpt.com/",
		icon: "assets/openai.png",
	},
	{
		title: "Notion",
		url: "https://www.notion.so/",
		icon: {
			dark: "assets/notion-light.png",
			light: "assets/notion.png",
		},
	},
	{
		title: "X (Twitter)",
		url: "https://x.com",
		icon: {
			dark: "assets/x-twitter-light.png",
			light: "assets/x.png",
		},
	},
	{
		title: "Whatsapp",
		url: "https://web.whatsapp.com/",
		icon: "assets/whatsapp.png",
	},
	{
		title: "Linkedin",
		url: "https://www.linkedin.com/",
		icon: "assets/linkedin.png",
	},
	{
		title: "Gmail",
		url: "https://mail.google.com/mail/",
		icon: "assets/gmail.png",
	},
	{
		title: "Youtube",
		url: "https://www.youtube.com/",
		icon: "assets/youtube.png",
	},
	{
		title: "Drive",
		url: "https://drive.google.com/",
		icon: "assets/drive.png",
	},
];

export function PopularApps() {
	const { settings } = useSettings();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					tabIndex={-1}
					className="w-auto aspect-square hover:scale-105 transition-transform [&_svg]:size-6 text-background dark:text-foreground cursor-pointer"
				>
					<LayoutGridIcon />
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-80 shadow-xl">
				<div className="grid gap-4 grid-cols-3">
					{POPULAR_APPS.map((app, _i) => (
						<Button
							key={app.url}
							asChild
							variant="secondary"
							className="h-fit focus-visible:ring-destructive bg-secondary/30 border border-border/10"
						>
							<a
								href={app.url}
								target={
									settings.general.openUrlIn === "current-tab"
										? "_self"
										: "_blank"
								}
								rel="noopener noreferrer"
								className="flex flex-col items-center justify-center gap-1 text-center"
							>
								{typeof app.icon === "string" ? (
									<img
										src={app.icon}
										alt={app.title}
										className="size-12 rounded-lg"
									/>
								) : (
									<>
										<img
											src={app.icon.light}
											alt={app.title}
											className="size-12 dark:hidden rounded-lg"
										/>
										<img
											src={app.icon.dark}
											alt={app.title}
											className="size-12 hidden dark:block rounded-lg"
										/>
									</>
								)}
								<p className="text-xs text-foreground">{app.title}</p>
							</a>
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
