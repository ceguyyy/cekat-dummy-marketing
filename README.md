# Cekat Marketing GTM demo

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
