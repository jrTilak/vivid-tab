import { Welcome } from "@/features/welcome";
import { WelcomeContextProvider } from "@/features/welcome/_context";
import { RootProvider } from "@/providers/root-provider";

const WelcomeTab = () => {
	return (
		<RootProvider theme="dark">
			<WelcomeContextProvider>
				<Welcome />
			</WelcomeContextProvider>
		</RootProvider>
	);
};

export default WelcomeTab;
