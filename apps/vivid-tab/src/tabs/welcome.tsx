import { Welcome } from "@/features/welcome";
import { WelcomeContextProvider } from "@/features/welcome/_context";
import { RootProvider } from "@/providers/root-provider";

const WelcomeTab = () => {
	return (
		<RootProvider>
			<WelcomeContextProvider>
				<Welcome />
			</WelcomeContextProvider>
		</RootProvider>
	);
};

export default WelcomeTab;
