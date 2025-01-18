import dateFns from "@/helpers/date-fns"
import stylesFns from "@/helpers/styles-fns"
import { useSettings } from "@/providers/settings-provider"
import background from "data-base64:@/assets/scene.jpg"
import { useEffect, useState } from "react"

function Minimal() {
  const [time, setTime] = useState(new Date())
  const { settings: { timer } } = useSettings()
  const [timerSize, setTimerSize] = useState(() => stylesFns.timerSize(timer.size))

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setTimerSize(stylesFns.timerSize(timer.size))
  }, [timer.size])

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
        className="h-full w-full absolute inset-0  bg-black/50 backdrop-blur-[1px]"
      />
      {timer.showTimer && <div
        style={{
          ...stylesFns.timerPosition(timer.position),
          margin: timer.position === "center" ? "auto" : timer.margin
        }}
        className="text-center fixed text-foreground">
        <h1
          style={{
            fontSize: timerSize.timerFontSize
          }}
          className="font-medium tracking-wider mb-0.5">
          {/* 12:00 */}
          {dateFns.formatTime(time, {
            hour12: timer.timeFormat === "12h",
            showSeconds: timer.showSeconds
          })}
        </h1>
        <p
          style={
            {
              fontSize: timerSize.dateFontSize
            }
          }
          className="font-light tracking-wide opacity-90">
          {/* Monday, January 1 */}
          {dateFns.formatDate(time)}
        </p>

        {/* greetings */}
        {timer.showGreetings && <p
          style={{
            fontSize: timerSize.greetingsFontSize
          }}
          className="font-light tracking-wide opacity-90">
          {/* Good morning */}
          {timer.greetingsText.replace("{{GREET}}", dateFns.getGreetings(time))}
        </p>}

      </div>}
    </div>
  )
}

export default Minimal