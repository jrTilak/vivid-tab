/**
 * Random int between min–max. Tries up to 5 times to avoid excluded numbers.
 * If all attempts fail, returns the last generated number (even if excluded).
 */
function randomInt(min: number, max: number, exclude: number[] = []) {
  const excluded = new Set(exclude)

  let num: number

  for (let i = 0; i < 5; i++) {
    num = Math.floor(Math.random() * (max - min + 1)) + min
    if (!excluded.has(num)) return num
  }

  return num!
}

export { randomInt }
