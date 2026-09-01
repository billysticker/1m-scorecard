# ChiroCandy $1M Growth Gap Scorecard

A zero-dependency web funnel with a two-page printable scorecard based on the ChiroCandy PDF layout.

## What it does

- Scores 20 statements from 0–2 for a true total of **0/40**.
- Guides visitors through welcome → scorecard → contact capture → results.
- Requires all 20 statements to be answered, then a name/email/phone, before revealing the diagnosis.
- Posts the lead (scores + contact) to `CONFIG.leadWebhookUrl` so n8n can upsert them in Go High Level with tag **1M Scorecard**.
- Shows four category totals out of 10 and recommends the lowest-scoring growth lever first.
- Calculates additional patients needed per month from an editable annual opportunity and patient lifetime value.
- Also supports editing the monthly patient target to calculate the annual opportunity in the other direction.
- Prints cleanly to a two-page US Letter PDF.

## Lead capture / Go High Level

Set `CONFIG.leadWebhookUrl` in `app.js` to the **n8n production** webhook URL (path `/webhook/scorecard-lead`), not the test URL.

```js
const CONFIG = {
  leadWebhookUrl: "https://your-n8n.example.com/webhook/scorecard-lead",
};
```

Leave it empty while developing locally — the form still gates results, but nothing is posted. Full GHL custom-field setup, Private Integration token steps, and the importable n8n workflow live in [`ghl-integration/`](ghl-integration/README.md).

## Run locally

Open `index.html` directly, or serve the folder with any static web server:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Deploy

The project is static and can deploy to Vercel with no build command. The repository root is the output directory.
