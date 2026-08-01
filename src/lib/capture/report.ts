/**
 * The one-line result a finished capture reports back (`gestures-spec.md` §7).
 * Framework-free so the wording is node-tested rather than eyeballed: a capture
 * can land fully, partially (Drive throttles a file), or with nothing but the
 * notes, and the line has to stay honest in all three cases.
 */

import type { CopyResult } from '@/lib/source/drive-write'

/** One clause per family of files written; empty when that family had nothing to write. */
function countClause(noun: string, { uploaded, total }: CopyResult): string {
  if (total === 0) return ''
  return uploaded === total ? `${uploaded} ${noun}${uploaded === 1 ? '' : 's'}` : `${uploaded} of ${total} ${noun}s`
}

/** The success line: what actually landed, plus a nudge if anything was held back. */
export function logMessage(copy: CopyResult, drawn: CopyResult): string {
  const parts = [countClause('reference', copy), countClause('drawing', drawn)].filter(Boolean)
  if (parts.length === 0) return 'Session logged to your Drive.'
  const partial = copy.uploaded < copy.total || drawn.uploaded < drawn.total
  return `Session logged — ${parts.join(' and ')} saved.${partial ? ' The rest were throttled; try again shortly.' : ''}`
}
