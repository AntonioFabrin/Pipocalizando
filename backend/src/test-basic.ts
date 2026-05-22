import assert from 'node:assert/strict';
import { normalizeRole } from './utils/roles';
import {
  canFinalizeApprovedPayment,
  canRejectPendingPayment,
  isValidProductDraft,
  normalizeSeatList,
} from './utils/flowRules';

assert.equal(normalizeRole('admin'), 'super_admin');
assert.equal(normalizeRole(undefined), 'customer');

assert.deepEqual(normalizeSeatList(['a1', ' B10 ', 'c3']), ['A1', 'B10', 'C3']);
assert.equal(normalizeSeatList(['A1', 'A1']), null);
assert.equal(normalizeSeatList(['Z9']), null);
assert.equal(normalizeSeatList([]), null);
assert.equal(normalizeSeatList('A1' as unknown), null);

assert.equal(canFinalizeApprovedPayment('pending'), true);
assert.equal(canFinalizeApprovedPayment('approved'), false);
assert.equal(canRejectPendingPayment('pending'), true);
assert.equal(canRejectPendingPayment('approved'), false);

assert.equal(isValidProductDraft({ name: 'Combo', price: 25 }), true);
assert.equal(isValidProductDraft({ name: '   ', price: 25 }), false);
assert.equal(isValidProductDraft({ name: 'Combo', price: 0 }), false);

console.log('Basic backend flow checks passed.');
