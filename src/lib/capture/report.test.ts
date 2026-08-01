import { describe, expect, it } from 'vitest'
import { logMessage } from './report'

const none = { uploaded: 0, total: 0 }

describe('logMessage', () => {
  it('reports both families when everything lands', () => {
    expect(logMessage({ uploaded: 11, total: 11 }, { uploaded: 11, total: 11 })).toBe(
      'Session logged — 11 references and 11 drawings saved.',
    )
  })

  it('reports references alone when no PSD was attached', () => {
    expect(logMessage({ uploaded: 5, total: 5 }, none)).toBe('Session logged — 5 references saved.')
  })

  it('falls back to a bare confirmation when only the notes were written', () => {
    expect(logMessage(none, none)).toBe('Session logged to your Drive.')
  })

  it('singularises a lone file', () => {
    expect(logMessage({ uploaded: 1, total: 1 }, { uploaded: 1, total: 1 })).toBe(
      'Session logged — 1 reference and 1 drawing saved.',
    )
  })

  it('says what was held back when Drive throttles part of the batch', () => {
    expect(logMessage({ uploaded: 3, total: 11 }, { uploaded: 11, total: 11 })).toBe(
      'Session logged — 3 of 11 references and 11 drawings saved. The rest were throttled; try again shortly.',
    )
  })

  it('flags a partial drawing upload too', () => {
    expect(logMessage({ uploaded: 4, total: 4 }, { uploaded: 1, total: 4 })).toContain('1 of 4 drawings')
  })

  it('counts drawings even when the session had no references to copy', () => {
    expect(logMessage(none, { uploaded: 2, total: 2 })).toBe('Session logged — 2 drawings saved.')
  })
})
