"""Local-only visual fixture server. No PowerSchool access or student data.
Run: py docs/tests/serve_toolbar.py
Open http://127.0.0.1:8769/tests/toolbar.html
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        url = urlparse(path).path
        if url == "/images/css/cdol_toolbar_counts.css":
            return str(ROOT.parent / "cdol_css/web_root/images/css/cdol_toolbar_counts.css")
        base = ROOT / ("docs" if url.startswith("/tests/") else "web_root")
        candidate = (base / url.lstrip("/")).resolve()
        return str(candidate if candidate.is_relative_to(base.resolve()) else base / "missing")


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8769), Handler).serve_forever()
