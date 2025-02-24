/**
 * Taken from @jrtilak/lazykit
 * See more about this method: https://lazykit.jrtilak.dev/docs/functions/functional/tryCatchAsync
 */

/**
 * Helps to safely execute asynchronous functions
 **/

type TryCatchReturnAsync<Err, Return> = Promise<
  [Err, undefined] | [undefined, Return]
>

const tryCatchAsync = async <Err extends Error, Return>(
  fn: () => Promise<Return>,
): TryCatchReturnAsync<Err, Return> => {
  try {
    const result = await fn()

    return [undefined, result] as [undefined, Return]
  } catch (error) {
    return [error as Err, undefined] as [Err, undefined]
  }
}

export default tryCatchAsync
