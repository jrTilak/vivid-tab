# Privacy Policy

Last updated: July 21, 2026

Vivid Tab respects your privacy. The extension does not include analytics or advertising, profile users, sell personal data, or send data to a server operated by Vivid Tab.

## Data stored by the extension

- Settings are stored with the browser's extension storage and may sync through the browser when browser sync is enabled.
- Notes, to-dos, cached weather, wallpaper metadata, and downloaded wallpapers are stored in the browser profile.
- Bookmarks, browsing history, and top sites remain managed by the browser. Vivid Tab reads them only for the features you enable.

The developer does not receive this locally stored data.

## Permissions and why they are used

- **Bookmarks:** required to display and manage bookmarks and the Vivid Tab bookmark folder.
- **Storage and unlimited storage:** used for settings, widgets, and cached wallpapers.
- **Search and top sites:** used to run searches through the browser and show frequently visited sites.
- **Geolocation:** used to request local weather when the weather widget needs fresh data.
- **Alarms:** used to schedule wallpaper refreshes.
- **History (optional, read-only):** used only when you enable history-based quick links. You can decline or revoke this permission.

## Data sent to third parties

Some features need remote data. Vivid Tab sends only the information needed to complete the requested feature:

- **Google Suggest (Chromium only):** when search suggestions are enabled, the text entered in the search dialog is sent to Google Suggest. Remote suggestions are disabled in Firefox.
- **ipapi and WeatherAPI:** Vivid Tab first asks the browser for an approximate position. If that is unavailable, ipapi uses the request's IP address to estimate a position. The resulting coordinates are sent to WeatherAPI to retrieve current weather.
- **Wallhaven:** when online wallpapers are enabled, a configured wallpaper keyword is sent to Wallhaven. Selected images and thumbnails are then downloaded from Wallhaven's image hosts.
- **Search providers:** submitting a normal search or bang navigates to the selected provider, which receives the query as part of that navigation.

These providers handle requests under their own privacy policies. Vivid Tab does not use these requests for analytics, advertising, profiling, or sale, and does not retain them on a Vivid Tab server.

Firefox classifies information handled outside the add-on as data transmission. Vivid Tab therefore declares `locationInfo` and `searchTerms` for Firefox even though the developer does not collect or retain those categories.

## Security

Vivid Tab limits extension and host permissions to the features described above. No method of local storage or network transmission is guaranteed to be completely secure, and third-party providers are responsible for their own systems.

## Changes and contact

This policy may be updated as Vivid Tab changes. Updates will be published in this repository. Questions can be sent to [contact@jrtilak.dev](mailto:contact@jrtilak.dev).
