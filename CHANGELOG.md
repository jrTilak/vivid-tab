# Changelog

## [1.4.0] - 2026-07-21

### Added

- Added bang shortcuts such as `!yt`, `!g`, and `!gh` to search directly on supported services.
- Added bundled quotes with selectable categories, so the quote widget no longer depends on a live quote API.
- Added Catppuccin Mocha and Tokyo Night themes, configurable corner radius, and opaque or translucent surfaces.
- Added uploaded, bookmarked, cached, and preloaded wallpaper management.
- Added automatic migration for unversioned 1.3 settings during the 1.4 update.
- Added extensive unit and Chromium/Firefox end-to-end coverage.

### Changed

- Reorganized the extension into focused Welcome, New Tab, and Settings features.
- Updated settings, widgets, dialogs, bookmarks, wallpaper controls, fonts, and icons for a more consistent interface.
- Refined wallpaper ordering and refresh behavior while preserving uploaded and bookmarked images.
- Narrowed remote access to the search-suggestion, weather, and wallpaper providers used by the extension.
- Disabled remote search suggestions in Firefox to comply with Mozilla's search-transmission policy.

### Fixed

- Fixed inconsistent translucent and radius styling across controls and dialogs.
- Fixed bookmark navigation, editing, fallback icons, and empty-root-folder behavior.
- Fixed several wallpaper loading, caching, selection, and refresh edge cases.
- Fixed development setup and cross-browser extension packaging issues.

## [1.3.0] - 2026-05-26

- Wallpaper switching improvements.
- Minor bug fixes, performance improvements, refactor.

## [1.2.0]

- Added **Firefox support** with major cross-browser fixes
- Support automatic wallpaper from wallhaven.
- Better **bookmark handling** and local file support
- New icons, UI polish, and welcome tab improvements
- Added review dialog, uninstall URL, legal links, and credits
- Multiple stability fixes
- FIX: Newline characters in notes not rendering correctly. (#78)
- FIX: Show terms and conditions and privacy policy on welcome page. (#81)
- FIX: Upgrade tailwind to v4. (#79)
- FIX: Support for local links (eg:file://)

## [1.1.0] - 2025-07-26

### Added

- FEAT: Support for random wallpapers. (#58)
- Show quotes in offline mode.
- Show weather in offline mode.
- Better UI in dark mode.
- Better UI in light mode.
- FEAT: move geolocation and history permission to be optional.

### Fixed

- BUG: Editing bookmarks within a folder not updating correctly. (#45)
- BUG: Weather widget not showing when offline. (#61)
- Fix: Welcome page opening randomly even when not installed/upgraded. (#65)
- Various minor bug fixes and improvements.

---

## [1.0.0]

### Added

- Initial release of the extension.
