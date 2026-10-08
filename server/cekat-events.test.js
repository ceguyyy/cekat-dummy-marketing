import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderPaidEvent, sendOrderPaidEvent } from './cekat-events.js';

test('sends the order_paid request body with header visitor ID taking precedence', async () => {
  const payload = buildOrderPaidEvent({
    status: 'paid', order_id: 'ord_12345', email: 'buyer@example.com',
    phone_number: '6281234567890', contact_name: 'Ada Lovelace',
    product_name: 'Cekat Pro Annual', payment_method: 'credit_card',
    amount: 125000, currency: 'IDR'
  }, { headers: { 'X-Cekat-Visitor-ID': 'header-visitor', cookie: '_cekat_visitor_id=cookie-visitor' } });
  let calls = 0;
  await sendOrderPaidEvent(payload, {
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, 'https://t.cekat.ai/api/events/ingest');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(options.body), {
        event_key: 'order_paid', is_common: true, email: 'buyer@example.com',
        phone_number: '6281234567890', contact_name: 'Ada Lovelace', visitor_id: 'header-visitor',
        properties: { amount: 125000, currency: 'IDR', order_id: 'ord_12345',
          product_name: 'Cekat Pro Annual', payment_method: 'credit_card' }
      });
      return new Response('', { status: 200 });
    }
  });
  assert.equal(calls, 1);
});
