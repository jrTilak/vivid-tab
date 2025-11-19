#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */

/**
 * Post-build script to fix CSS references in production build
 * Copies the shared CSS file to the root and updates HTML references
 */

const fs = require("fs")
const path = require("path")

// Support both Chrome and Firefox builds
const target = process.argv[2] || "chrome-mv3-prod"
const buildDir = path.join(__dirname, "../build", target)

// Find the CSS file in tabs directory
const tabsDir = path.join(buildDir, "tabs")
const cssFiles = fs.existsSync(tabsDir)
  ? fs.readdirSync(tabsDir).filter((f) => f.endsWith(".css"))
  : []

if (cssFiles.length === 0) {
  console.log("No CSS files found to copy")
  process.exit(0)
}

// Copy CSS to root
cssFiles.forEach((cssFile) => {
  const sourcePath = path.join(tabsDir, cssFile)
  const destPath = path.join(buildDir, cssFile)

  fs.copyFileSync(sourcePath, destPath)
  console.log(`✅ Copied ${cssFile} to root`)

  // Update newtab.html to reference the CSS from root
  const newtabHtmlPath = path.join(buildDir, "newtab.html")

  if (fs.existsSync(newtabHtmlPath)) {
    let html = fs.readFileSync(newtabHtmlPath, "utf8")

    html = html.replace(`/tabs/${cssFile}`, `/${cssFile}`)
    fs.writeFileSync(newtabHtmlPath, html)
    console.log(`✅ Updated newtab.html to reference /${cssFile}`)
  }
})
