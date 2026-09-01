# ChiroCandy $1M Growth Gap Scorecard

A zero-dependency web funnel with a two-page printable scorecard based on the ChiroCandy PDF layout.

## What it does

- Scores 20 statements from 0–2 for a true total of **0/40**.
- Guides visitors through welcome → scorecard → contact capture → results.
- Requires all 20 statements to be answered, then a name/email/phone, before revealing the diagnosis.
- Posts the lead (scores + contact) to `CONFIG.leadWebhookUrl` so n8n can upsert them in Go High Level with tag **1M Scorecard**.
- Shows four category totals out of 10 and recommends the lowest-scoring growth lever first.
- Renders per-category next-step recommendations (copy lives in `RECOMMENDATIONS` in `app.js`) and links to a plan call plus the 34-minute masterclass.
- Calculates additional patients needed per month from an editable annual opportunity and patient lifetime value.
- Also supports editing the monthly patient target to calculate the annual opportunity in the other direction.
- Prints cleanly to a two-page US Letter PDF.

## Lead capture / Go High Level

Set `CONFIG.leadWebhookUrl` in `app.js` to the **n8n production** webhook URL (path `/webhook/scorecard-lead`), not the test URL.

```js
const CONFIG = {
  leadWebhookUrl: "https://your-n8n.example.com/webhook/scorecard-lead",
  bookingUrl: "https://chirocandy.com/schedule/",
  trainingUrl: "https://go.chirocandy.com/next-1-million-training",
  gtmId: "GTM-WTMHXMN",
  metaPixelId: "1677430622530607",
};
```

- `leadWebhookUrl` — n8n production webhook. Leave empty while developing locally; the form still gates results, but nothing is posted.
- `bookingUrl` — scheduling link for **Book a Call**. The results screen appends `name`, `email`, and `utm_content` (`n8-t5-k3-f9-NUMBERS`) from the captured lead and scores.
- `trainingUrl` — 34-minute masterclass, **Your Next $1M in Practice**.
- `gtmId` / `metaPixelId` — loaded only after cookie **Accept**, same as chirocandy.com.

Cookie consent uses the same `chirocandy-cookie-consent` key, bar copy, Reject/Accept actions, and Cookies reopen control as [chirocandy.com](https://chirocandy.com/). Terms and Privacy link to `https://chirocandy.com/terms-conditions/` and `https://chirocandy.com/privacy-policy/`.

All recommendation headlines, body copy, service lists, and `ctaLabel` values live in the `RECOMMENDATIONS` object in `app.js`, keyed by category (`numbers`, `trust`, `known`, `found`) and score band (`low` 0–4, `mid` 5–7, `high` 8–10). Edit that object to change results-page copy without touching markup.

Full GHL custom-field setup, Private Integration token steps, and the importable n8n workflow live in [`ghl-integration/`](ghl-integration/README.md).

## Run locally

Open `index.html` directly, or serve the folder with any static web server:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Deploy

The project is static and can deploy to Vercel with no build command. The repository root is the output directory.
