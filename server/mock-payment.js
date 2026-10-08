import { enqueueOrderPaid, sendOrderPaidEvent } from './cekat-events.js';

// In-memory queue for this demo only; production needs a durable unique outbox.
const jobs = new Map();
const queue = {
  async enqueueUnique(key, payload) {
    if (!jobs.has(key)) jobs.set(key, payload);
  }
};

const order = {
  status: 'paid',
  order_id: 'mock_ord_12345',
  email: 'buyer@example.com',
  phone_number: '6281234567890',
  contact_name: 'Ada Lovelace',
  amount: 125000,
  currency: 'IDR',
  product_name: 'Cekat Pro Annual',
  payment_method: 'credit_card'
};
const request = { headers: { 'x-cekat-visitor-id': 'mock-visitor' } };

console.log('Mock payment succeeded:', order.order_id);
await enqueueOrderPaid({ order, request, queue });
// Simulate a repeated success notification for the same order.
await enqueueOrderPaid({ order, request, queue });
console.log('Queued events:', jobs.size);

for (const payload of jobs.values()) {
  await sendOrderPaidEvent(payload, {
    apiKey: 'mock-key-unused',
    fetchImpl: async (url, options) => {
      console.log('Mock POST (no network request):', url);
      console.log(JSON.stringify(JSON.parse(options.body), null, 2));
      return new Response('', { status: 200 });
    }
  });
}
