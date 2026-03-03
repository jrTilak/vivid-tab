/**
 * Taken from @jrtilak/lazykit
 * See more about this method: https://lazykit.jrtilak.dev/docs/react-hooks/effect/useAsyncEffect
 */

import { useEffect } from "react"

/**
 * A custom hook that handles async operations inside `useEffect`.
 * Optionally pass an isMounted getter to guard setState after unmount:
 * useAsyncEffect(async (isMounted) => { const d = await fetch(); if (!isMounted()) return; setData(d); }, [])
 */
const useAsyncEffect = (
  effect: (isMounted?: () => boolean) => Promise<void>,
  deps?: unknown[],
) => {
  useEffect(() => {
    let mounted = true
    const isMounted = () => mounted

    const runEffect = async () => {
      await effect(isMounted)
    }

    runEffect()

    return () => {
      mounted = false
    }
  }, deps)
}

export { useAsyncEffect }
