# Vivid Tab - A New Tab, A New Vibe

Vivid Tab is an open-source Chrome and Firefox extension that transforms your new tab into a customizable productivity dashboard. It keeps bookmarks, bang search, notes, to-dos, weather, quotes, and wallpapers close at hand.

🔗 [Get it on Chrome Web Store](https://chromewebstore.google.com/detail/vivid-tab/hchlkclbagoklpnijoadpghhcjpeoeim)

🔗 [Get it for Firefox](https://addons.mozilla.org/en-US/firefox/addon/vivid-tab/)

---

## 🚀 Highlights

- 🔖 **Unlimited Bookmarks** - Display unlimited bookmarks as shortcuts for quick access to your favorite sites.
- 🔎 **Bang Search** - Use shortcuts such as `!yt`, `!g`, or `!gh` to search supported services directly.
- 🎨 **Fully Customizable** - Drag and drop components, change backgrounds, and personalize your layout.
- ✅ **To-Dos & Notes** - Stay organized with built-in task lists and quick notes.
- ☁️ **Weather & Location-based Insights** - Get real-time weather updates and relevant local information.
- 🌍 **Forever Free & Open Source** - Vivid Tab is completely free and welcomes community contributions.
- ☁️ Random wallpaper support using the Wallhaven API

---

## 📌 Preview

![Vivid Tab preview](https://vividtab.jrtilak.dev/preview.png)

---

## 🛠 Built With

The extension is built with **Plasmo**, and the product website is built with **Astro**.

🔗 [Plasmo Documentation](https://docs.plasmo.com/)

---

## 🔗 Installation

### Install from Chrome Web Store

🔗 [Vivid Tab on Chrome Web Store](https://chromewebstore.google.com/detail/vivid-tab/hchlkclbagoklpnijoadpghhcjpeoeim)

### Manual Installation

1. Download the source code or clone the repository:
   ```sh
   git clone https://github.com/jrtilak/vivid-tab.git
   ```
2. Install dependencies:
   ```sh
   bun install
   ```
3. Start development mode:
   ```sh
   bun run --cwd apps/vivid-tab dev
   ```
   or build the project:
   ```sh
   bun run --cwd apps/vivid-tab build
   ```
4. Navigate to `chrome://extensions/` in your browser.
5. Enable **Developer Mode** (toggle in the top right corner).
6. Click **Load Unpacked** and select `apps/vivid-tab/build/chrome-mv3-prod`.

## 🔒 Privacy and Terms

Vivid Tab does not run analytics, profile users, sell personal data, or retain data on a Vivid Tab server. Features such as weather, online wallpapers, searches, and optional Chromium suggestions contact their respective providers only when needed. Read the [Privacy Policy](./PRIVACY.md) and [Terms of Service](./TERMS.md) for details.

---

> **Note:** `dev` is the default branch. For the latest stable release code, use `master`: https://github.com/jrTilak/vivid-tab/tree/master

---

## 🤝 Contributing

Vivid Tab is an evolving project with room for enhancements. If you have ideas or improvements, feel free to contribute!

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m "Added new feature"`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a Pull Request.

---

## 🙏 Credits

Vivid Tab is built with the help of these amazing resources:

- 🎨 **[SVG Repo](https://www.svgrepo.com/)** - For the beautiful SVG icons used throughout the extension.
- 😊 **[Brixmoji](https://brixmoji.com/)** - For the awesome emojis that bring personality to the interface.
- 🖼️ **[Wallhaven](https://wallhaven.cc/)** - For providing the wallpaper API that enhances the visual experience.
- 🚀 **[Plasmo](https://www.plasmo.com/)** - For the awesome framework that makes building Chrome extensions a breeze.

---

## 📜 License

This project is open source and available under the [MIT License](./LICENSE).

---

## 📬 Contact

For questions or suggestions, reach out to me at:

- 🌐 [GitHub](https://github.com/jrtilak)
- 📧 contact@jrtilak.dev

---

Thank you for checking out **Vivid Tab**! 🚀
