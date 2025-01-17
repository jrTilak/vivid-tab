class DateFns {
  formatTime(
    date: Date,
    config: {
      hour12: boolean
      showSeconds: boolean
    }
  ) {
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: config.hour12,
        second: config.showSeconds ? "2-digit" : undefined
      })
      .replace(/\s/g, "")
  }

  formatDate(date: Date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    })
  }

  getGreetings(date: Date) {
    const hours = date.getHours()
    if (hours >= 0 && hours < 12) {
      return "Good morning"
    } else if (hours >= 12 && hours < 17) {
      return "Good afternoon"
    } else {
      return "Good evening"
    }
  }
}

export default new DateFns()
