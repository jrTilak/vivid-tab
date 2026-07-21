const { TestEnvironment: JSDOMEnvironment } = require("jest-environment-jsdom");

const nodeWebGlobals = new Map(
	[
		"fetch",
		"Headers",
		"ReadableStream",
		"Request",
		"Response",
		"TextDecoder",
		"TextEncoder",
		"TransformStream",
		"structuredClone",
	]
		.map((name) => [name, globalThis[name]])
		.filter(([, value]) => value !== undefined),
);

/** Adds the Node web APIs that JSDOM intentionally does not expose. */
class VividTabJSDOMEnvironment extends JSDOMEnvironment {
	async setup() {
		await super.setup();

		for (const [name, value] of nodeWebGlobals) {
			if (this.global[name] !== undefined) continue;

			Object.defineProperty(this.global, name, {
				configurable: true,
				value,
				writable: true,
			});
		}

		if (this.global.matchMedia === undefined) {
			this.global.matchMedia = (query) => ({
				addEventListener() {},
				addListener() {},
				dispatchEvent: () => true,
				matches: false,
				media: query,
				onchange: null,
				removeEventListener() {},
				removeListener() {},
			});
		}
	}
}

module.exports = VividTabJSDOMEnvironment;
