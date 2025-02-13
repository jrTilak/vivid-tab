import { cn } from "@/helpers/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-black/50 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
