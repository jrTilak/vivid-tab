import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useReducer,
} from "react";
import type { WelcomeDirection, WelcomeStep } from "./types";

type WelcomeState = {
	currentStep: WelcomeStep;
	direction: WelcomeDirection;
};

type WelcomeContextValue = WelcomeState & {
	navigate: (step: WelcomeStep, direction: WelcomeDirection) => void;
};

type NavigateAction = {
	type: "navigate";
	step: WelcomeStep;
	direction: WelcomeDirection;
};

const INITIAL_STATE: WelcomeState = {
	currentStep: "WELCOME",
	direction: "forward",
};

const WelcomeContext = createContext<WelcomeContextValue | null>(null);

const reducer = (state: WelcomeState, action: NavigateAction): WelcomeState => {
	if (
		state.currentStep === action.step &&
		state.direction === action.direction
	) {
		return state;
	}

	return {
		currentStep: action.step,
		direction: action.direction,
	};
};

/**
 * Stores step and animation direction in one state transition so consumers never
 * render a new panel with the previous panel's animation direction.
 */
const WelcomeContextProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

	const navigate = useCallback(
		(step: WelcomeStep, direction: WelcomeDirection) => {
			dispatch({ type: "navigate", step, direction });
		},
		[],
	);

	const value = useMemo(() => ({ ...state, navigate }), [navigate, state]);

	return (
		<WelcomeContext.Provider value={value}>{children}</WelcomeContext.Provider>
	);
};

const useWelcomeContext = () => {
	const context = useContext(WelcomeContext);

	if (!context) {
		throw new Error(
			"useWelcomeContext must be used within a WelcomeContextProvider",
		);
	}

	return context;
};

export { useWelcomeContext, WelcomeContextProvider };
