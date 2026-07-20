import { IconApps } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useSettings } from "@/providers/settings-provider";
import { POPULAR_APPS } from "./popular-apps-data";

export function PopularApps() {
	const { settings } = useSettings();

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					aria-label="Open popular apps"
					className="text-background transition-transform hover:scale-105 dark:text-foreground"
					size="icon"
					type="button"
					variant="ghost"
				>
					<IconApps className="size-6" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 shadow-xl">
				<div className="grid grid-cols-3 gap-4">
					{POPULAR_APPS.map((app) => (
						<Button
							asChild
							className="h-auto flex-col gap-1 border-border/10 py-3 text-center"
							key={app.url}
							variant="secondary"
						>
							<a
								href={app.url}
								rel="noopener noreferrer"
								target={
									settings.general.openUrlIn === "current-tab"
										? "_self"
										: "_blank"
								}
							>
								{typeof app.icon === "string" ? (
									<img
										alt=""
										className="size-12 rounded-lg"
										decoding="async"
										draggable={false}
										src={chrome.runtime.getURL(app.icon)}
									/>
								) : (
									<>
										<img
											alt=""
											className="size-12 rounded-lg dark:hidden"
											decoding="async"
											draggable={false}
											src={chrome.runtime.getURL(app.icon.light)}
										/>
										<img
											alt=""
											className="hidden size-12 rounded-lg dark:block"
											decoding="async"
											draggable={false}
											src={chrome.runtime.getURL(app.icon.dark)}
										/>
									</>
								)}
								<span className="text-xs text-foreground">{app.title}</span>
							</a>
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
