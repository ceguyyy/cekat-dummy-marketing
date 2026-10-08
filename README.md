# Cekat Marketing GTM demo

## Server-side paid-order integration

For this mockup, run `npm run mock:payment`. It simulates a successful payment
and a repeated success notification, queues one event in memory, and prints the
request payload using a mocked HTTP client. It makes no network call and needs
no API key. The in-memory deduplication lasts only for that process.

`server/cekat-events.js` requires Node.js 20+ and uses native `fetch`. It is
server-only and is not imported into the Vite app. Set `CEKAT_API_KEY` in the
backend worker's environment (load your server's `.env` using its environment
loader). Never give this variable a `VITE_` prefix.

This repository has no payment backend. The integration is ready for a backend
adapter, but cannot fire until connected to a verified payment-success handler
and a durable queue/outbox:

```js
import { enqueueOrderPaid, sendOrderPaidEvent } from './server/cekat-events.js';

// In the verified payment-success handler, after confirming payment with the
// provider: atomically persist the paid order and this outbox entry.
await enqueueOrderPaid({ order: paidOrder, request, queue: transactionalOutbox });

// In a separate worker, process the persisted payload:
await sendOrderPaidEvent(job.payload);
```

`paidOrder` must use `status: 'paid'` and the API's field names: `order_id`,
`amount`, `currency`, and `email` and/or `phone_number`. Optional fields are
`contact_name`, `product_name`, and `payment_method`. Capture visitor identity
on the original checkout request and persist it if payment confirmation arrives
through a provider webhook; provider webhooks usually lack browser cookies.

The adapter's `enqueueUnique(key, payload)` must insert atomically with a unique
constraint on the key and keep completed keys, so repeated payment notifications
cannot enqueue a second event. Do not expose this hook as an unauthenticated
browser endpoint. Payment status must come from verified server-side state.

The worker retries network errors and 5xx responses three times after the initial
attempt, waiting 1, 2, and 4 seconds. It logs rejected response bodies and does not
retry 4xx. Disable additional queue-level automatic retries; retain failed jobs
for inspection and payload correction. Response bodies may contain customer data,
so use access-controlled server logs.

Unique jobs prevent duplicate scheduling. Exactly-once remote delivery cannot be
guaranteed after ambiguous network failures without API-side idempotency support;
the supplied API contract has no idempotency mechanism. The backend adapter and
its deployment remain required for live delivery.

Run the request-body unit test with `npm test`.

A self-contained demo landing page for a fictional Cekat Marketing Growth Sprint. Try the lead form, service picker, case study, FAQ, and consultation booking flow to generate more GTM events. The interactions are simulated and do not send or store form data.

## Run it

Install the dependencies and start the local server:

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local URL printed by Vite. If using Command Prompt instead of PowerShell, copy `.env.example` to `.env` with `copy .env.example .env`.

## Connect Google Tag Manager

1. Create or select a GTM web container and copy its ID (for example, `GTM-ABC1234`).
2. Set `VITE_GTM_ID` in your local `.env` file:

   ```env
   VITE_GTM_ID=GTM-ABC1234
   ```

3. Restart the dev server after changing `.env`.
4. In GTM Preview, connect to the page URL and test the events below. Publish the container when ready.

GTM container IDs are client-side identifiers, not secrets. Vite embeds the configured ID in the served page to load GTM. `.env` is excluded from version control; do not put private credentials in `VITE_` variables.

The page pushes these events to `dataLayer`:

| Event | When it fires | Useful parameters |
| --- | --- | --- |
| `page_view` | Page initializes | `page_type`, `page_name` |
| `cta_click` | Hero CTA is clicked | `cta_id`, `cta_text` |
| `service_select` | A sample service is selected | `service_id`, `service_name` |
| `case_study_open` | The sample case study is expanded | `content_id` |
| `faq_open` | The sample FAQ is expanded | `faq_id` |
| `plan_option_select` | A plan dropdown changes | `option_name`, `option_value` |
| `generate_lead` | The valid demo form is submitted | `form_id`, `business_goal`, `monthly_budget` |
| `consultation_option_select` | A consultation topic or time is selected | `option_name`, `option_value` |
| `schedule_consultation` | The sample booking form is submitted | `form_id`, `consultation_topic`, `consultation_slot` |

`generate_lead` and `schedule_consultation` are simulated conversions for testing; they do not represent real leads or bookings. The demo does not collect personal details, and form values are only used locally to validate the interaction.
