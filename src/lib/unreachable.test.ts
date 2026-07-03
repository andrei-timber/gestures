import { describe, expect, it } from 'vitest'
import { unreachable } from './unreachable'

describe('unreachable', () => {
  it('throws with the offending value in the message', () => {
    // Cast through unknown because callers only reach this with a `never`.
    expect(() => unreachable('surprise' as never)).toThrowError(/surprise/)
  })
})
