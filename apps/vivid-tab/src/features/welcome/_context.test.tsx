import { describe, expect, test } from "@test/jest";
import { act, renderHook } from "@testing-library/react";
import { createElement, type PropsWithChildren } from "react";
import { useWelcomeContext, WelcomeContextProvider } from "./_context";

const Wrapper = ({ children }: PropsWithChildren) =>
	createElement(WelcomeContextProvider, { children });

describe("useWelcomeContext", () => {
	test("requires the matching provider", () => {
		expect(() => renderHook(() => useWelcomeContext())).toThrow(
			"useWelcomeContext must be used within a WelcomeContextProvider",
		);
	});

	test("updates the step and animation direction together", () => {
		const { result } = renderHook(() => useWelcomeContext(), {
			wrapper: Wrapper,
		});

		expect(result.current.currentStep).toBe("WELCOME");
		expect(result.current.direction).toBe("forward");

		act(() => result.current.navigate("IMPORT", "forward"));

		expect(result.current.currentStep).toBe("IMPORT");
		expect(result.current.direction).toBe("forward");

		act(() => result.current.navigate("WELCOME", "backward"));

		expect(result.current.currentStep).toBe("WELCOME");
		expect(result.current.direction).toBe("backward");
	});

	test("preserves the memoized value for an identical navigation", () => {
		const { result } = renderHook(() => useWelcomeContext(), {
			wrapper: Wrapper,
		});
		const initialValue = result.current;

		act(() => result.current.navigate("WELCOME", "forward"));

		expect(result.current).toBe(initialValue);
	});
});
