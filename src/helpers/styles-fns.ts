class StylesFns {
  settingsTriggerPosition(position: string) {
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

  timerPosition(position: string) {
    switch (position) {
      case "top-left":
        return {
          top: "4px",
          left: "4px"
        }

      case "top-right":
        return {
          top: "4px",
          right: "4px"
        }

      case "bottom-left":
        return {
          bottom: "4px",
          left: "4px"
        }

      case "bottom-right":
        return {
          bottom: "4px",
          right: "4px"
        }

      case "center":
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }
    }
  }
}

export default new StylesFns()
