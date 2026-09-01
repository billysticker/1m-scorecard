# Go High Level integration

After someone finishes the scorecard they enter their name, email, and phone to unlock results. The site posts that payload to an n8n webhook. n8n upserts the contact in Go High Level (tag **1M Scorecard**) and notifies `#sales` in Slack.

```
Scorecard form  →  n8n /webhook/scorecard-lead  →  GHL POST /contacts/upsert
                                              ↘  Slack #sales
```

## 1. Create a Private Integration token

Create the token on the **sub-account** (location) that should own the leads, not the agency account.

1. Open the sub-account in HighLevel.
2. Go to **Settings → Private Integrations**.
   If you do not see it, enable Private Integrations under **Labs**, then refresh.
3. Click **Create new Integration**.
4. Name it something like `1M Scorecard` and add a short description.
5. Enable only these scopes:
   - **contacts.write** — create/update contacts (needed by the n8n upsert)
   - **locations/customFields.readonly** — list existing fields
   - **locations/customFields.write** — create the scorecard fields
6. Create the integration and **copy the token immediately**. HighLevel will not show it again.
7. Copy the **Location ID** from the sub-account URL (`/v2/location/<LOCATION_ID>/…`) or from **Settings → Business Info**.

Rotate the token about every 90 days from the same Private Integrations screen.

Official API docs: [HighLevel API v2](https://marketplace.gohighlevel.com/docs/).  
Auth pattern used here:

```
Authorization: Bearer <PRIVATE_INTEGRATION_TOKEN>
Version: 2021-07-28
```

Base URL: `https://services.leadconnectorhq.com`

## 2. Create the contact custom fields

Requires Node 18+ (native `fetch`). No npm install.

```bash
cd ghl-integration
GHL_TOKEN='pit-...' GHL_LOCATION_ID='yourLocationId' node setup-custom-fields.js
```

The script calls:

- `GET /locations/:locationId/customFields?model=contact`
- `POST /locations/:locationId/customFields` with `model: "contact"` and `dataType` `NUMERICAL` or `TEXT`

It skips any field whose name already exists, then prints the `id` and `fieldKey` for:

| Name            | Type       | Expected fieldKey (confirm from script output) |
| --------------- | ---------- | ---------------------------------------------- |
| 1M Total Score  | NUMERICAL  | `contact.1m_total_score`                       |
| Numbers Score   | NUMERICAL  | `contact.numbers_score`                        |
| Trust Score     | NUMERICAL  | `contact.trust_score`                          |
| Known Score     | NUMERICAL  | `contact.known_score`                          |
| Found Score     | NUMERICAL  | `contact.found_score`                          |
| Top Priority    | TEXT       | `contact.top_priority`                         |

If HighLevel generated different keys, paste the printed `fieldKey` values into the n8n **Upsert GHL Contact** node.

## 3. Import the n8n workflow

1. In n8n: **Workflows → Import from File** and choose `n8n-scorecard-workflow.json`.
2. Open the sticky notes on the canvas and follow the setup steps.
3. Replace `{{GHL_TOKEN}}` and `{{GHL_LOCATION_ID}}` in the HTTP Request node. Preferred: Header Auth credential (`Authorization: Bearer <token>`) plus the location ID as a fixed value. Do not commit real tokens.
4. Confirm the `customFields[].key` values match the script output.
5. Connect a Slack credential. The node posts to `#sales`.
6. Activate the workflow and copy the **Production** webhook URL  
   (`https://<n8n-host>/webhook/scorecard-lead`).
7. Paste that URL into `CONFIG.leadWebhookUrl` in `app.js`.

The webhook accepts:

```json
{
  "firstName": "Alex",
  "lastName": "Rivera",
  "email": "alex@practice.com",
  "phone": "+15555550123",
  "totalScore": 28,
  "numbersScore": 6,
  "trustScore": 8,
  "knownScore": 7,
  "foundScore": 7,
  "topPriority": "NUMBERS",
  "source": "1m-scorecard",
  "submittedAt": "2026-08-31T18:00:00.000Z"
}
```

Missing or malformed `email` returns `400`. Success returns `200 {"ok":true}`.

The GHL upsert uses tag **`1M Scorecard`**. HighLevel’s upsert **overwrites** existing tags on a matched contact; new scorecard leads are unaffected.

## 4. Point the scorecard at n8n

In `app.js`:

```js
const CONFIG = {
  leadWebhookUrl: "https://your-n8n.example.com/webhook/scorecard-lead",
};
```

Use the n8n **production** webhook URL, not the test URL. The webhook node allows browser CORS (`*`) so the static site can POST from another origin.
