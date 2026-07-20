export const getBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("firefox")) {
      return "firefox";
    } else if (userAgent.includes("chrome") || userAgent.includes("chromium")) {
      return "chrome";
    } else {
      return "other";
    }
}