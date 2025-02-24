class DateFns {
  formatTime(
    date: Date,
    config: {
      hour12: boolean
      showSeconds: boolean
    },
  ) {
    return date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: config.hour12,
        second: config.showSeconds ? "2-digit" : undefined,
      })
      .replace(/\s/g, "")
      .replace(/(AM|PM)/, " $1") // Ensure space before AM/PM
  }

  formatDate(date: Date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }
}

const dateFns = new DateFns()

export default dateFns
