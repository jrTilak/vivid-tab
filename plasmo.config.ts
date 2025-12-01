/** plasmo.config.js */
export default {
  vite: {
    build: {
      target: "esnext",
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: {
            // React core libraries
            react: ["react", "react-dom"],

            // UI and icon libraries
            vendor: [
              "lucide-react",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-avatar",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-context-menu",
              "@radix-ui/react-dialog",
              "@radix-ui/react-label",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-separator",
              "@radix-ui/react-slider",
              "@radix-ui/react-slot",
              "@radix-ui/react-switch",
              "motion",
              "date-fns"
            ]
          }
        }
      }
    }
  }
}

