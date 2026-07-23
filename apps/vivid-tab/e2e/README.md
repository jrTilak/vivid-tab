# Vivid Tab browser E2E tests

These tests load the packaged extension into isolated Chromium and Firefox
profiles. They exercise Welcome, New Tab, and Settings through the UI, then
verify the resulting browser bookmarks and extension storage.

```sh
bun run test:e2e       # Chromium, then Firefox
bun run test:e2e:c     # Chromium only
bun run test:e2e:ff    # Firefox only
```

The suite is headless by default. Set `E2E_HEADLESS=false` to see the browser.
`E2E_SKIP_BUILD=true` reuses existing build artifacts. The other optional
controls are `E2E_TIMEOUT_MS`, `E2E_CHROMIUM_BINARY`,
`E2E_CHROMEDRIVER_BINARY`, and `E2E_FIREFOX_BINARY`.

New Tab journeys keep the desktop-only React widgets mounted even when a tiling
window manager constrains a visible browser below the `xl` breakpoint. The CSS
viewport remains unchanged, while Notes and Todos stay available for testing.

Failed tests save screenshots under `.e2e/screenshots`. Browser-specific entry
files use `.c.test.ts` for Chromium and `.ff.test.ts` for Firefox; both call the
same feature suites so their coverage cannot drift.
