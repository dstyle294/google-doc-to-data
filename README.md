# google-doc-to-data

Track your REU progress to a 400-hour goal using a Google Doc as the source of truth.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `credentials.json` from Google Cloud OAuth client credentials.

## Generate tracker data

```bash
python3 get_google_doc.py <DOC_ID> --format summary --output docs/summary.json
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
3. Re-run the summary generation command whenever your Google Doc updates (or automate with GitHub Actions later).
