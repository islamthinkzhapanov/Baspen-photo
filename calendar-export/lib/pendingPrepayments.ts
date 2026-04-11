/**
 * Global set of appointment IDs that are currently in prepayment flow.
 * These should be hidden from the calendar until payment is resolved.
 */
const pending = new Set<string>();

export function addPendingPrepayment(id: string) {
  pending.add(id);
}

export function removePendingPrepayment(id: string) {
  pending.delete(id);
}

export function isPendingPrepayment(id: string) {
  return pending.has(id);
}
