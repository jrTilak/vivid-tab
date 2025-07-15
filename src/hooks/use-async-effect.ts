/**
 * Taken from @jrtilak/lazykit
 * See more about this method: https://lazykit.jrtilak.dev/docs/react-hooks/effect/useAsyncEffect
 */

import { useEffect } from "react"

/**
 * A custom hook that handles async operations inside `useEffect`.
 */
const useAsyncEffect = (effect: () => Promise<void>, deps?: unknown[]) => {
  useEffect(() => {
    const runEffect = async () => {
      await effect()
    }

    runEffect()
  }, deps)
}

export { useAsyncEffect }
