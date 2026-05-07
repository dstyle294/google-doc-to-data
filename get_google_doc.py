#!/usr/bin/env python3
"""Google Doc downloader.

Fetches a Google Docs document by ID and prints it to stdout or saves it to a file.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/documents.readonly"]
DEFAULT_CREDENTIALS = "credentials.json"
DEFAULT_TOKEN = "token.json"


def get_docs_service(credentials_path: str = DEFAULT_CREDENTIALS, token_path: str = DEFAULT_TOKEN):
    """Create a Google Docs API service using OAuth 2.0 credentials."""
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(
                    f"OAuth2 credentials file not found: {credentials_path}. "
                    "Create credentials in Google Cloud Console and save them as credentials.json."
                )
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=8000)
        with open(token_path, "w", encoding="utf-8") as token_file:
            token_file.write(creds.to_json())

    return build("docs", "v1", credentials=creds)


def read_paragraph_element(element: dict) -> str:
    text_run = element.get("textRun")
    if not text_run:
        return ""
    return text_run.get("content", "")


def read_paragraph(paragraph: dict) -> str:
    return "".join(read_paragraph_element(el) for el in paragraph.get("elements", []))


def process_structural_elements(elements: list[dict]) -> str:
    lines: list[str] = []
    for element in elements:
        if "paragraph" in element:
            paragraph = element["paragraph"]
            text = read_paragraph(paragraph).rstrip("\n")
            if text:
                if paragraph.get("bullet"):
                    lines.append(f"- {text}")
                else:
                    lines.append(text)
            else:
                lines.append("")
        elif "table" in element:
            table = element["table"]
            for row in table.get("tableRows", []):
                row_text = []
                for cell in row.get("tableCells", []):
                    cell_text = process_structural_elements(cell.get("content", []))
                    row_text.append(cell_text.replace("\n", " ").strip())
                lines.append("\t".join(row_text))
            lines.append("")
        elif "tableOfContents" in element:
            toc = element["tableOfContents"]
            lines.append(process_structural_elements(toc.get("content", [])))
        else:
            continue
    return "\n".join(lines).strip() + "\n"


def get_document_text(document: dict) -> str:
    body = document.get("body", {})
    content = body.get("content", [])
    return process_structural_elements(content)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download and print a Google Docs document.")
    parser.add_argument("doc_id", help="Google Doc ID from the document URL.")
    parser.add_argument("--output", "-o", help="Write output to a file instead of stdout.")
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format: plain text or raw JSON from the Google Docs API.",
    )
    parser.add_argument(
        "--credentials",
        default=DEFAULT_CREDENTIALS,
        help="Path to OAuth2 client credentials JSON file.",
    )
    parser.add_argument(
        "--token",
        default=DEFAULT_TOKEN,
        help="Path to cached OAuth2 token JSON file.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        service = get_docs_service(credentials_path=args.credentials, token_path=args.token)
        document = service.documents().get(documentId=args.doc_id).execute()
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        return 1
    except Exception as error:
        print(f"Failed to fetch document: {error}", file=sys.stderr)
        return 2

    if args.format == "json":
        output_data = json.dumps(document, indent=2, ensure_ascii=False)
    else:
        output_data = get_document_text(document)

    if args.output:
        Path(args.output).write_text(output_data, encoding="utf-8")
    else:
        sys.stdout.write(output_data)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
