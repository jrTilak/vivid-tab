/**
 * @type {import('postcss').ProcessOptions}
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "postcss-wrap": {
      selector: ".__vivid-container", // Wrap all styles inside this class,
      skip: [":root", ".dark"],
    },
  },
}
