# Changelog

## [1.2.1] - 2025-03-03

### Fixed

- Bookmarks folder refresh, todos expiry and cleanup, search shortcuts and layout drag-and-drop guards.
- Import/export: import works with current export format and partial files; corrected button icons and export filename.
- Random wallpapers: IndexedDB "object store not found" fix (shared openImageDB with version bump), safe settings parse and random selection.
- Misc: background message response on error, settings sync debounce and reset scope, notes/todos immutable sort, quote and useAsyncEffect fixes.

## [1.2.0] - ........

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
