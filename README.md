# ChiroCandy $1M Growth Gap Scorecard

A zero-dependency, three-step web funnel with a two-page printable scorecard based on the ChiroCandy PDF layout.

## What it does

- Scores 20 statements from 0–2 for a true total of **0/40**.
- Guides visitors through a three-step funnel: welcome, scorecard, and results.
- Requires all 20 statements to be answered before revealing the diagnosis, so a 0/40 represents 20 deliberate "No" answers rather than an unfinished form.
- Shows four category totals out of 10 and recommends the lowest-scoring growth lever first.
- Calculates additional patients needed per month from an editable annual opportunity and patient lifetime value.
- Also supports editing the monthly patient target to calculate the annual opportunity in the other direction.
- Prints cleanly to a two-page US Letter PDF.

## Run locally

Open `index.html` directly, or serve the folder with any static web server:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Deploy

The project is static and can deploy to Vercel with no build command. The repository root is the output directory.
