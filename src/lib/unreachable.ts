/**
 * Exhaustive-switch guard. Put in a `default:` branch so the compiler proves
 * every discriminated-union case is handled; throws if one is ever missed.
 *
 *   switch (mode) {
 *     case 'class': return ...
 *     case 'quick': return ...
 *     default: return unreachable(mode)
 *   }
 */
export function unreachable(value: never): never {
  throw new Error(`Unreachable case reached: ${JSON.stringify(value)}`)
}
