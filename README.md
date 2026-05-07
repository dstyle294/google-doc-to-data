# google-doc-to-data

Track your REU progress to a 400-hour goal using a Google Doc as the source of truth.

## Live website behavior

The site now attempts to pull your Google Doc **live in-browser** using:

- Doc ID: `1sAIRvfsQbaeaGf1VB56usTGRIxhn4SfEHTYN9oyp_08`
- Export URL pattern: `https://docs.google.com/document/d/<DOC_ID>/export?format=txt`

If live fetch fails, it falls back to `docs/summary.json`.

> Important: for live browser fetch to work on GitHub Pages, your Google Doc must be shared/published so the export endpoint is accessible.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `credentials.json` from Google Cloud OAuth client credentials if you also want to generate snapshot JSON via script.

## Generate fallback tracker data

```bash
python3 get_google_doc.py 1sAIRvfsQbaeaGf1VB56usTGRIxhn4SfEHTYN9oyp_08 --format summary --output docs/summary.json
```

This parses Google Doc table content and computes:
- fall_2025 hours
- winter_2026 hours
- spring_2026 hours
- completed / remaining hours against a 400-hour goal
- task rows with numeric hour values

## Run website locally

```bash
python3 -m http.server 8000 --directory docs
```

Then open <http://localhost:8000>.

## GitHub Pages deployment

1. Push repository to GitHub.
2. In repository settings, enable Pages and set source to `/docs` on your main branch.
3. The site will try live doc fetch on each page load; optionally refresh `summary.json` as a safety fallback snapshot.
