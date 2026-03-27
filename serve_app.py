#!/usr/bin/env python3
"""Serve the built Vite frontend and proxy /api requests to the Node backend.

Usage:
  python3 serve_app.py
  PORT=8080 BACKEND_URL=http://127.0.0.1:5001 python3 serve_app.py

This server expects the frontend to already be built into ./dist.
"""

from __future__ import annotations

import json
import mimetypes
import os
import posixpath
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "dist"
INDEX_FILE = DIST_DIR / "index.html"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:5001").rstrip("/")
MAX_BODY_SIZE = 10 * 1024 * 1024


class AppHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self) -> None:
        if self.path.startswith("/api/"):
            self._proxy_request()
        else:
            self._serve_static()

    def do_POST(self) -> None:
        self._proxy_request()

    def do_PUT(self) -> None:
        self._proxy_request()

    def do_PATCH(self) -> None:
        self._proxy_request()

    def do_DELETE(self) -> None:
        self._proxy_request()

    def do_OPTIONS(self) -> None:
        if self.path.startswith("/api/"):
            self.send_response(204)
            self.send_header("Allow", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "*"))
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", self.headers.get("Access-Control-Request-Headers", "Content-Type, Authorization"))
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_error(405, "Method Not Allowed")

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        print(f"[{self.log_date_time_string()}] {self.address_string()} - {format % args}")

    def _serve_static(self) -> None:
        if not DIST_DIR.exists() or not INDEX_FILE.exists():
            self._send_json(
                500,
                {
                    "message": "Frontend build not found.",
                    "hint": "Run `npm install` and `npm run build` in the project root before starting serve_app.py.",
                    "expected": str(INDEX_FILE),
                },
            )
            return

        requested_path = urlsplit(self.path).path
        normalized = posixpath.normpath(requested_path).lstrip("/")
        candidate = (DIST_DIR / normalized).resolve()

        if normalized and self._is_safe_path(candidate) and candidate.is_file():
            self._send_file(candidate)
            return

        self._send_file(INDEX_FILE)

    def _is_safe_path(self, path: Path) -> bool:
        try:
            path.relative_to(DIST_DIR.resolve())
            return True
        except ValueError:
            return False

    def _send_file(self, file_path: Path) -> None:
        content = file_path.read_bytes()
        content_type, _ = mimetypes.guess_type(str(file_path))
        self.send_response(200)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _proxy_request(self) -> None:
        body = self._read_body()
        upstream_url = self._build_upstream_url()
        headers = self._build_upstream_headers(len(body))

        request = Request(upstream_url, data=body if body else None, headers=headers, method=self.command)

        try:
            with urlopen(request, timeout=30) as response:
                payload = response.read()
                self._relay_response(response.status, response.headers, payload)
        except HTTPError as error:
            payload = error.read()
            self._relay_response(error.code, error.headers, payload)
        except URLError as error:
            self._send_json(
                502,
                {
                    "message": "Could not reach backend service.",
                    "backendUrl": BACKEND_URL,
                    "detail": str(error.reason),
                },
            )

    def _build_upstream_url(self) -> str:
        parsed = urlsplit(self.path)
        return urlunsplit(("http", BACKEND_URL.removeprefix("http://").removeprefix("https://"), parsed.path, parsed.query, ""))

    def _build_upstream_headers(self, body_length: int) -> dict[str, str]:
        headers: dict[str, str] = {}
        for key in ("Content-Type", "Authorization", "Accept"):
            value = self.headers.get(key)
            if value:
                headers[key] = value
        headers["Host"] = urlsplit(BACKEND_URL).netloc
        if body_length:
            headers["Content-Length"] = str(body_length)
        return headers

    def _relay_response(self, status_code: int, upstream_headers, payload: bytes) -> None:
        self.send_response(status_code)

        excluded_headers = {
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailers",
            "transfer-encoding",
            "upgrade",
            "content-length",
            "access-control-allow-origin",
            "access-control-allow-credentials",
        }

        content_type_sent = False
        for header, value in upstream_headers.items():
            if header.lower() in excluded_headers:
                continue
            if header.lower() == "content-type":
                content_type_sent = True
            self.send_header(header, value)

        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Credentials", "true")

        if not content_type_sent:
            self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _read_body(self) -> bytes:
        length = self.headers.get("Content-Length")
        if not length:
            return b""
        size = int(length)
        if size > MAX_BODY_SIZE:
            raise ValueError("Request body too large")
        return self.rfile.read(size)

    def _send_json(self, status_code: int, data: dict) -> None:
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Serving frontend from {DIST_DIR} on http://{HOST}:{PORT}")
    print(f"Proxying API requests to {BACKEND_URL}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        server.server_close()
