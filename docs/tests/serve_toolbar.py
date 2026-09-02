"""Local-only visual fixture server. No PowerSchool access or student data.
Run: py docs/tests/serve_toolbar.py
Open http://127.0.0.1:8769/tests/toolbar.html
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html import escape
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[2]


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/tests/student_alert.html":
            template = (ROOT / "docs/tests/student_alert.html").read_text(encoding="utf-8")
            source = (ROOT / "web_root/wildcards/title_student_end_css.missedmedication.student.alert.txt").read_text()
            anchor = source.split(";]", 1)[1].split("[/tlist_sql]", 1)[0]
            # The SQL and server authorization gates are tested separately. This
            # fixture renders the actual anchor with a fictional student FRN.
            shown = parse_qs(url.query).get("show", ["yes"])[0] == "yes"
            body = template.replace("<!-- STUDENT_ALERT -->",
                                    anchor.replace("~(studentfrn)", "001900001") if shown else "")
        elif url.path == "/admin/students/medication/administration.html":
            frn = escape(parse_qs(url.query).get("frn", [""])[0])
            body = ("<!doctype html><html lang='en'><meta charset='utf-8'>"
                    "<title>Student Administration test destination</title>"
                    "<h1>Student Administration test destination</h1>"
                    f"<p>Fictional student FRN: {frn}</p></html>")
        else:
            return super().do_GET()
        data = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def translate_path(self, path):
        url = urlparse(path).path
        if url == "/admin/reports_pscb_dev_pro/health/cdol_missed_daily_administration.html":
            return str(ROOT / "docs/tests/missed_report_destination.html")
        if url == "/images/css/cdol_toolbar_counts.css":
            return str(ROOT.parent / "cdol_css/web_root/images/css/cdol_toolbar_counts.css")
        if url == "/tests/icon-meds-reference.svg":
            return str(ROOT.parent / "cdol_custom_alerts/web_root/images/img/icon-meds.svg")
        base = ROOT / ("docs" if url.startswith("/tests/") else "web_root")
        candidate = (base / url.lstrip("/")).resolve()
        return str(candidate if candidate.is_relative_to(base.resolve()) else base / "missing")


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8769), Handler).serve_forever()
