const { basename } = require("node:path");

module.exports = {
	process(_source, filename) {
		return {
			code: `module.exports = ${JSON.stringify(`test-asset://${basename(filename)}`)};`,
		};
	},
};
