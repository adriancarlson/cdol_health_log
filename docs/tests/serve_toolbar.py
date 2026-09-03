"""Local-only visual fixture server. No PowerSchool access or student data.
Run: py docs/tests/serve_toolbar.py
Open http://127.0.0.1:8769/tests/toolbar.html
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html import escape
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from student_alert_fixture import render_student_alert
from test_missed_medication_count import MissedMedicationCountTest

ROOT = Path(__file__).resolve().parents[2]


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/tests/student_alert.html":
            template = (ROOT / "docs/tests/student_alert.html").read_text(encoding="utf-8")
            source = (ROOT / "web_root/wildcards/title_student_end_css.missedmedication.student.alert.txt").read_text()
            # Execute the shipped SQL against fictional data, then substitute
            # row fields by position, as PowerSchool does inside tlist_sql.
            shown = parse_qs(url.query).get("show", ["yes"])[0] == "yes"
            fixture = MissedMedicationCountTest()
            fixture.setUp()
            try:
                fixture.db.execute("UPDATE students SET id=7, dcid=900001")
                fixture.db.execute("UPDATE u_student_medication SET studentsdcid=900001")
                fixture.calendar("2026-09-01")
                fixture.calendar("2026-09-02")
                if not shown:
                    for txn, date in enumerate(("2026-08-31", "2026-09-01", "2026-09-02"), start=1):
                        fixture.transaction(txn=txn, date=date)
                rows = fixture.student_alert_rows(student=900001, date="2026-09-02")
                body = template.replace("<!-- STUDENT_ALERT -->", render_student_alert(source, rows))
            finally:
                fixture.doCleanups()
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
