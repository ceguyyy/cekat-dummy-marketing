import { setTimeout as sleep } from 'node:timers/promises';

const endpoint = 'https://t.cekat.ai/api/events/ingest';

function header(request, name) {
  if (typeof request?.headers?.get === 'function') return request.headers.get(name);
  const entry = Object.entries(request?.headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return entry?.[1];
}

export function buildOrderPaidEvent(order, request) {
  if (order.status !== 'paid') throw new Error('Order must have a confirmed paid status');
  if (!order.order_id || typeof order.order_id !== 'string') throw new Error('order_id is required');
  if (!Number.isFinite(order.amount) || order.amount < 0) throw new Error('amount must be a nonnegative number');
  if (!/^[A-Z]{3}$/.test(order.currency || '')) throw new Error('currency must be a three-letter uppercase code');
  const email = order.email?.trim();
  const phone = order.phone_number?.trim();
  if (!email && !phone) throw new Error('email or phone_number is required');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email');
  if (phone && !/^[1-9]\d{6,14}$/.test(phone)) throw new Error('phone_number must contain country-code digits without a plus sign');

  const visitorHeader = header(request, 'X-Cekat-Visitor-ID');
  const cookie = String(header(request, 'cookie') || '').split(';').map(value => value.trim())
    .find(value => value.startsWith('_cekat_visitor_id='));
  let visitorId = typeof visitorHeader === 'string' ? visitorHeader.trim() : '';
  if (!visitorId && cookie) {
    try { visitorId = decodeURIComponent(cookie.slice('_cekat_visitor_id='.length)); } catch { /* Ignore malformed cookies. */ }
  }
  return {
    event_key: 'order_paid',
    is_common: true,
    ...(email && { email }),
    ...(phone && { phone_number: phone }),
    ...(order.contact_name && { contact_name: order.contact_name }),
    ...(visitorId && { visitor_id: visitorId }),
    properties: {
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      ...(order.product_name && { product_name: order.product_name }),
      ...(order.payment_method && { payment_method: order.payment_method })
    }
  };
}

// queue.enqueueUnique must durably persist the payload and enforce a unique key
// across workers and restarts, retaining that key after delivery.
// Call inside the order's paid-state transaction using a transactional outbox.
export async function enqueueOrderPaid({ order, request, queue }) {
  const payload = buildOrderPaidEvent(order, request);
  await queue.enqueueUnique(`cekat-order-paid:${order.order_id}`, payload);
}

// Run in a background worker, never in the customer's request handler.
export async function sendOrderPaidEvent(payload, {
  apiKey = process.env.CEKAT_API_KEY,
  fetchImpl = globalThis.fetch,
  wait = sleep,
  logger = console
} = {}) {
  if (!apiKey?.trim()) throw new Error('CEKAT_API_KEY is required on the server');
  for (let attempt = 0; attempt <= 3; attempt++) {
    let response;
    let body;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
      body = await response.text();
    } catch (error) {
      logger.error('Cekat event network failure', { order_id: payload.properties.order_id, attempt: attempt + 1, error: error.message });
      if (attempt === 3) throw error;
      await wait(1000 * 2 ** attempt);
      continue;
    }
    if (response.ok) return;
    logger.error('Cekat event rejected', { order_id: payload.properties.order_id, status: response.status, body, attempt: attempt + 1 });
    const error = new Error(`Cekat Events API returned ${response.status}`);
    if (response.status < 500 || response.status > 599 || attempt === 3) throw error;
    await wait(1000 * 2 ** attempt);
  }
}
