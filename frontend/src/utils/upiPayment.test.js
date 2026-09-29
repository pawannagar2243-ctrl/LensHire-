import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UPI_PROVIDERS,
  shouldShowUpiPaymentSelector,
  shouldAllowDirectBookingConfirmation,
  getUpiProviderConfig,
  buildUpiPaymentLink,
} from './upiPayment.js';

test('UPI providers include Google Pay, PhonePe, and Paytm config', () => {
  const values = UPI_PROVIDERS.map((provider) => provider.value);

  assert.equal(values.includes('googlepay'), true);
  assert.equal(values.includes('phonepe'), true);
  assert.equal(values.includes('paytm'), true);
});

test('UPI selector only shows for UPI payment method', () => {
  assert.equal(shouldShowUpiPaymentSelector('upi'), true);
  assert.equal(shouldShowUpiPaymentSelector('cash'), false);
  assert.equal(shouldShowUpiPaymentSelector('online'), false);
});

test('Cash payment should allow confirm booking; UPI and online should not', () => {
  assert.equal(shouldAllowDirectBookingConfirmation('cash'), true);
  assert.equal(shouldAllowDirectBookingConfirmation('upi'), false);
  assert.equal(shouldAllowDirectBookingConfirmation('online'), false);
});

test('Provider config uses fallback UPI ID and QR link builds correctly', () => {
  const provider = getUpiProviderConfig('phonepe', { VITE_PHONEPE_UPI_ID: 'test@upi' });
  assert.equal(provider.upiId, 'test@upi');

  const link = buildUpiPaymentLink({
    provider: 'phonepe',
    amount: 1234,
    label: 'Camera Booking',
    env: { VITE_PHONEPE_UPI_ID: 'test@upi' },
  });

  assert.match(link, /^upi:\/\/pay\?/);
  assert.match(link, /pa=test%40upi/);
  assert.match(link, /am=1234\.00/);
});
