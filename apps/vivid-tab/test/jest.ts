import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	jest,
	test,
} from "@jest/globals";

// biome-ignore lint/suspicious/noExplicitAny: Jest's own FunctionLike uses any at this compatibility boundary.
type AnyFunction = (...arguments_: any[]) => any;

type LooseMock<T extends AnyFunction> = jest.Mock<
	(...arguments_: Parameters<AnyFunction>) => ReturnType<T>
>;

/** Keeps Bun's permissive mock-call typing while Jest provides the runtime. */
const createMock = <T extends AnyFunction = AnyFunction>(implementation?: T) =>
	jest.fn(implementation) as LooseMock<T>;

/** Jest equivalents for the concise mock helpers used throughout the suite. */
const mock = Object.assign(createMock, {
	restore: () => jest.restoreAllMocks(),
});
const spyOn = jest.spyOn;

export {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	jest,
	mock,
	spyOn,
	test,
};
