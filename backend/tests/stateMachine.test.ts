import { describe, it, expect } from 'vitest';
import {
  isValidStateTransition,
  LISTING_STATE_TRANSITIONS,
  REPORT_STATE_TRANSITIONS,
  CLAIM_STATE_TRANSITIONS,
} from '../src/utils/stateMachine';

describe('State Machine Transitions', () => {
  it('should allow valid listing state transitions', () => {
    expect(isValidStateTransition('ACTIVE', 'RESERVED', LISTING_STATE_TRANSITIONS)).toBe(true);
    expect(isValidStateTransition('RESERVED', 'SOLD', LISTING_STATE_TRANSITIONS)).toBe(true);
    expect(isValidStateTransition('ACTIVE', 'EXCHANGED', LISTING_STATE_TRANSITIONS)).toBe(true);
    expect(isValidStateTransition('ACTIVE', 'GIVEN_AWAY', LISTING_STATE_TRANSITIONS)).toBe(true);
  });

  it('should reject invalid listing state jumps', () => {
    expect(isValidStateTransition('SOLD', 'ACTIVE', LISTING_STATE_TRANSITIONS)).toBe(false);
    expect(isValidStateTransition('REMOVED', 'ACTIVE', LISTING_STATE_TRANSITIONS)).toBe(false);
    expect(isValidStateTransition('EXCHANGED', 'RESERVED', LISTING_STATE_TRANSITIONS)).toBe(false);
  });

  it('should validate report and claim transitions correctly', () => {
    expect(isValidStateTransition('LOST', 'CLAIMED', REPORT_STATE_TRANSITIONS)).toBe(true);
    expect(isValidStateTransition('CLAIMED', 'RESOLVED', REPORT_STATE_TRANSITIONS)).toBe(true);
    expect(isValidStateTransition('PENDING', 'ACCEPTED', CLAIM_STATE_TRANSITIONS)).toBe(true);
    expect(isValidStateTransition('ACCEPTED', 'PENDING', CLAIM_STATE_TRANSITIONS)).toBe(false);
  });
});
