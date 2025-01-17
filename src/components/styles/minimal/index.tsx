import dateFns from "@/helpers/date-fns"
import stylesFns from "@/helpers/styles-fns"
import { useSettings } from "@/providers/settings-provider"
import background from "data-base64:@/assets/scene.jpg"
import { useEffect, useState } from "react"

function Minimal() {
  const [time, setTime] = useState(new Date())
  const { settings: { timer } } = useSettings()

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="h-screen w-screen relative bg-transparent bg-black"
    >
      <img
        src={background}
        alt="scene"
        className="h-full w-full object-cover object-center absolute inset-0"
      />
      <div
        className="h-full w-full absolute inset-0  bg-black"
        style={{
          opacity: 0.5
        }}
      />
      {timer.showTimer && <div
        style={{
          ...stylesFns.timerPosition(timer.position)
        }}
        className="text-center fixed text-foreground">
        <h1 className="text-8xl font-light tracking-wider mb-2">
          {/* 12:00 */}
          {dateFns.formatTime(time, {
            hour12: timer.timeFormat === "12h",
            showSeconds: timer.showSeconds
          })}
        </h1>
        <p className="text-2xl font-light tracking-wide opacity-90">
          {/* Monday, January 1 */}
          {dateFns.formatDate(time)}
        </p>

        {/* greetings */}
        {timer.showGreetings && <p className="text-2xl font-light tracking-wide opacity-90">
          {/* Good morning */}
          {timer.greetingsText.replace("{{GREET}}", dateFns.getGreetings(time))}
        </p>}

      </div>}
    </div>
  )
}

export default Minimal