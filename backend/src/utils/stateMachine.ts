export const LISTING_STATE_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['RESERVED', 'EXCHANGED', 'GIVEN_AWAY', 'CLOSED', 'REMOVED'],
  RESERVED: ['ACTIVE', 'SOLD', 'CLOSED', 'REMOVED'],
  SOLD: [],
  EXCHANGED: [],
  GIVEN_AWAY: [],
  CLOSED: ['ACTIVE'],
  REMOVED: [],
};

export const REPORT_STATE_TRANSITIONS: Record<string, string[]> = {
  LOST: ['CLAIMED', 'RESOLVED', 'CLOSED'],
  FOUND: ['CLAIMED', 'RESOLVED', 'CLOSED'],
  CLAIMED: ['LOST', 'FOUND', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

export const CLAIM_STATE_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function isValidStateTransition(
  currentStatus: string,
  newStatus: string,
  transitionsMap: Record<string, string[]>
): boolean {
  if (currentStatus === newStatus) return true;
  const allowed = transitionsMap[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}
