const test = require('node:test');
const assert = require('node:assert/strict');

const { isAdminRole } = require('../utils/roles');

test('admin and super_admin are treated as admin roles', () => {
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('super_admin'), true);
  assert.equal(isAdminRole('user'), false);
});
