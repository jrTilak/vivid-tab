/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--vivid-border))",
        input: "hsl(var(--vivid-input))",
        ring: "hsl(var(--vivid-ring))",
        background: "hsl(var(--vivid-background))",
        foreground: "hsl(var(--vivid-foreground))",
        primary: {
          DEFAULT: "hsl(var(--vivid-primary))",
          foreground: "hsl(var(--vivid-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--vivid-secondary))",
          foreground: "hsl(var(--vivid-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--vivid-destructive))",
          foreground: "hsl(var(--vivid-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--vivid-muted))",
          foreground: "hsl(var(--vivid-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--vivid-accent))",
          foreground: "hsl(var(--vivid-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--vivid-popover))",
          foreground: "hsl(var(--vivid-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--vivid-card))",
          foreground: "hsl(var(--vivid-card-foreground))",
        },
      },
      borderRadius: {
        lg: `var(--vivid-radius)`,
        md: `calc(var(--vivid-radius) - 2px)`,
        sm: "calc(var(--vivid-radius) - 4px)",
      },
      fontFamily: {
        "bricolage-grotesque": ["Bricolage Grotesque", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
