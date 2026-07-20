import { Welcome } from "@/components/screens/tabs/welcome";
import { WelcomeContextProvider } from "@/components/screens/tabs/welcome/_context";
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
