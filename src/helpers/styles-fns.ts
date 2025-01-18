import type { TimerSize } from "@/common/settings"
import type { CSSProperties } from "react"

class StylesFns {
  settingsTriggerPosition(position: string): CSSProperties {
    switch (position) {
      case "top-left":
        return {
          marginTop: "4px",
          marginLeft: "4px",
          top: "4px",
          left: "4px"
        }
      case "top-right":
        return {
          marginTop: "4px",
          marginRight: "4px",
          top: "4px",
          right: "4px"
        }

      case "bottom-left":
        return {
          marginBottom: "4px",
          marginLeft: "4px",
          bottom: "4px",
          left: "4px"
        }

      case "bottom-right":
        return {
          marginBottom: "4px",
          marginRight: "4px",
          bottom: "4px",
          right: "4px"
        }
    }
  }

  timerPosition(position: string): CSSProperties {
    switch (position) {
      case "top-left":
        return {
          top: "4px",
          left: "4px",
          textAlign: "left"
        }

      case "top-right":
        return {
          top: "4px",
          right: "4px",
          textAlign: "right"
        }

      case "bottom-left":
        return {
          bottom: "4px",
          left: "4px",
          textAlign: "left"
        }

      case "bottom-right":
        return {
          bottom: "4px",
          right: "4px",
          textAlign: "right"
        }

      case "center":
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }
    }
  }

  timerSize(size: TimerSize) {
    // timerFontSize: larger
    // greetingsFontSize: slightly smaller
    // dateFontSize: smaller

    switch (size) {
      case "extra-large":
        return {
          timerFontSize: 48,
          greetingsFontSize: 24,
          dateFontSize: 16
        }

      case "large":
        return {
          timerFontSize: 36,
          greetingsFontSize: 18,
          dateFontSize: 14
        }

      case "medium":
        return {
          timerFontSize: 24,
          greetingsFontSize: 16,
          dateFontSize: 12
        }

      case "small":
        return {
          timerFontSize: 18,
          greetingsFontSize: 14,
          dateFontSize: 10
        }

      case "extra-small":
        return {
          timerFontSize: 14,
          greetingsFontSize: 12,
          dateFontSize: 8
        }
    }
  }
}

export default new StylesFns()
