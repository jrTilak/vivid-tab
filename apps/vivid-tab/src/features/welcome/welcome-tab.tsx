import { IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { useWelcomeContext } from "./_context";

const WelcomeTab = () => {
	const { navigate } = useWelcomeContext();

	return (
		<Card className="w-full max-w-lg gap-4 py-5 text-center">
			<CardContent className="space-y-6 pt-4">
				<img
					alt="Vivid Tab"
					className="mx-auto size-20"
					decoding="async"
					draggable={false}
					src={chrome.runtime.getURL("assets/icon.png")}
				/>
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold">Hi, I&apos;m Vivid!</h1>
					<p className="text-base">
						I&apos;ll help you stay productive and motivated.
					</p>
				</div>
			</CardContent>
			<CardFooter className="flex-col justify-center gap-4 pt-4">
				<Button
					className="font-semibold shadow-xl"
					onClick={() => navigate("IMPORT", "forward")}
					type="button"
					variant="secondary"
				>
					START <IconArrowRight />
				</Button>
				<p className="text-xs text-muted-foreground">
					By using Vivid Tab, you agree to our{" "}
					<Link
						href="https://vividtab.jrtilak.dev/privacy"
						rel="noreferrer"
						target="_blank"
					>
						Privacy Policy
					</Link>{" "}
					and{" "}
					<Link
						href="https://vividtab.jrtilak.dev/terms"
						rel="noreferrer"
						target="_blank"
					>
						Terms of Service
					</Link>
					.
				</p>
			</CardFooter>
		</Card>
	);
};

export { WelcomeTab };
