"""Exercise the shipped SQL CTEs with fictional data, without a PowerSchool connection.

SQLite substitutes for Oracle only in this test: dates use ordinal day numbers,
TRUNC/NVL are registered, session tags are bound, and the JSON envelope is removed.
This does not replace a live Oracle/PowerSchool authorization test.
Run: py docs/tests/test_missed_medication_count.py
"""
import datetime as dt
import math
import json
from pathlib import Path
import shutil
import sqlite3
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "web_root/admin/medication/data/missedMedicationCount.json").read_text()


def day(value):
    return dt.date.fromisoformat(value).toordinal()


class MissedMedicationCountTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.addCleanup(self.db.close)
        self.db.create_function("NVL", 2, lambda a, b: b if a is None else a)
        self.db.create_function("TRUNC", -1, lambda value, *fmt: None if value is None else (
            math.floor(value) - dt.date.fromordinal(math.floor(value)).weekday()
            if fmt else math.floor(value)))
        self.db.executescript("""
            CREATE TABLE u_student_medication (id, studentsdcid, schoolid, yearid, frequency);
            CREATE TABLE u_student_medication_inventory (u_student_medication_id, added_date);
            CREATE TABLE u_cdol_med_admin_setting (id, schoolid, daily_cutoff_time);
            CREATE TABLE students (id, dcid, schoolid, entrydate, exitdate);
            CREATE TABLE reenrollments (studentid, schoolid, entrydate, exitdate);
            CREATE TABLE terms (schoolid, yearid, isyearrec, firstday, lastday);
            CREATE TABLE calendar_day (schoolid, date_value, insession);
            CREATE TABLE u_student_med_inv_txn (id, u_student_medication_id, transaction_type,
                event_date, reversal_of_transaction_id);
            INSERT INTO u_cdol_med_admin_setting VALUES (1, 101, 54000), (2, 102, 57600);
        """)
        for school in (101, 102):
            self.db.execute("INSERT INTO terms VALUES (?, 36, 1, ?, ?)",
                            (school, day("2026-08-01"), day("2027-05-31")))
        self.medication()
        self.calendar("2026-08-31")

    def medication(self, med=1, student=1, school=101, year=36, frequency="daily", added="2026-08-28"):
        self.db.execute("INSERT INTO u_student_medication VALUES (?, ?, ?, ?, ?)",
                        (med, student, school, year, frequency))
        self.db.execute("INSERT INTO u_student_medication_inventory VALUES (?, ?)", (med, day(added)))
        if not self.db.execute("SELECT 1 FROM students WHERE dcid=?", (student,)).fetchone():
            self.db.execute("INSERT INTO students VALUES (?, ?, ?, ?, ?)",
                            (student, student, school, day("2026-08-01"), day("2027-06-01")))

    def calendar(self, date, school=101, insession=1):
        self.db.execute("INSERT INTO calendar_day VALUES (?, ?, ?)", (school, day(date), insession))

    def transaction(self, txn=1, med=1, kind="ADMINISTRATION", date="2026-08-31", original=None):
        self.db.execute("INSERT INTO u_student_med_inv_txn VALUES (?, ?, ?, ?, ?)",
                        (txn, med, kind, day(date), original))

    def count(self, date="2026-08-31", seconds=54000, school=101, year=36):
        sql = self.query(date, seconds, school, year)
        return self.db.execute(sql).fetchone()[0]

    def query(self, date="2026-08-31", seconds=54000, school=101, year=36):
        sql = SOURCE.split("~[tlist_sql;", 1)[1].split(";]~(data)", 1)[0]
        sql = sql.replace("~(curschoolid)", str(school)).replace("~(curyearid)", str(year))
        sql = sql.replace("SYSDATE", str(day(date) + seconds / 86400))
        start = sql.index("    SELECT JSON_OBJECT(")
        end = sql.index("    FROM expected_rows expected", start)
        sql = sql[:start] + " SELECT COUNT(DISTINCT expected.studentsdcid)\n" + sql[end:]
        return sql

    def test_today_cutoff_uses_server_time(self):
        self.assertEqual(0, self.count(seconds=53999))
        self.assertEqual(1, self.count(seconds=54000))
        self.assertEqual(1, self.count(seconds=54001))

    def test_old_gap_counts_before_todays_cutoff(self):
        self.assertEqual(1, self.count(date="2026-09-01", seconds=0))

    def test_student_count_not_dose_count(self):
        self.medication(med=2)
        self.calendar("2026-09-01")
        self.assertEqual(1, self.count(date="2026-09-01"))
        self.medication(med=3, student=2)
        self.assertEqual(2, self.count(date="2026-09-01"))

    def test_given_and_not_given_resolve_without_dropping_other_gaps(self):
        self.calendar("2026-09-01")
        self.transaction()
        self.assertEqual(1, self.count(date="2026-09-01"))
        self.transaction(txn=2, kind="NON_ADMINISTRATION", date="2026-09-01")
        self.assertEqual(0, self.count(date="2026-09-01"))

    def test_weekends_are_excluded_even_if_in_session(self):
        self.db.execute("DELETE FROM calendar_day")
        self.calendar("2026-08-29")
        self.calendar("2026-08-30")
        self.assertEqual(0, self.count())

    def test_non_session_and_future_dates_excluded(self):
        self.db.execute("UPDATE calendar_day SET insession=0")
        self.calendar("2026-09-01")
        self.assertEqual(0, self.count())

    def test_first_inventory_date_is_exclusive_and_refill_does_not_reset_it(self):
        self.db.execute("UPDATE u_student_medication_inventory SET added_date=?", (day("2026-08-31"),))
        self.assertEqual(0, self.count())
        self.calendar("2026-09-01")
        self.db.execute("INSERT INTO u_student_medication_inventory VALUES (1, ?)", (day("2026-09-01"),))
        self.assertEqual(1, self.count(date="2026-09-01"))

    def test_inventory_required_but_no_balance_filter(self):
        self.transaction(kind="PARENT_PICKUP")
        self.assertEqual(1, self.count())
        self.db.execute("DELETE FROM u_student_medication_inventory")
        self.assertEqual(0, self.count())

    def test_only_daily_frequency(self):
        for frequency in ("prn", "asneeded", "twicedaily", ""):
            self.db.execute("UPDATE u_student_medication SET frequency=?", (frequency,))
            self.assertEqual(0, self.count())
        self.db.execute("UPDATE u_student_medication SET frequency=' Daily '")
        self.assertEqual(1, self.count())

    def test_missing_school_setting_suppresses_all_gaps(self):
        self.db.execute("DELETE FROM u_cdol_med_admin_setting WHERE schoolid=101")
        self.assertEqual(0, self.count(date="2026-09-01"))

    def test_latest_nonnull_setting_matches_administration_query(self):
        self.db.execute("INSERT INTO u_cdol_med_admin_setting VALUES (3, 101, 57600)")
        self.assertEqual(0, self.count())
        self.db.execute("INSERT INTO u_cdol_med_admin_setting VALUES (4, 101, NULL)")
        self.assertEqual(1, self.count(seconds=57600))

    def test_school_year_context_and_school_specific_cutoff(self):
        self.medication(med=2, student=2, school=102)
        self.calendar("2026-08-31", school=102)
        self.assertEqual(0, self.count(school=102))
        self.assertEqual(1, self.count(school=102, seconds=57600))
        self.assertEqual(0, self.count(year=35))
        self.assertEqual(0, self.count(school=0))

    def test_enrollment_entry_inclusive_exit_exclusive_and_transfer(self):
        self.db.execute("UPDATE students SET entrydate=?", (day("2026-09-01"),))
        self.assertEqual(0, self.count())
        self.db.execute("UPDATE students SET entrydate=?, exitdate=?",
                        (day("2026-08-01"), day("2026-08-31")))
        self.assertEqual(0, self.count())
        self.db.execute("INSERT INTO reenrollments VALUES (1, 101, ?, ?)",
                        (day("2026-08-31"), day("2026-09-01")))
        self.assertEqual(1, self.count())

    def test_duplicate_calendar_terms_enrollment_never_inflate_count(self):
        for table in ("calendar_day", "terms", "students"):
            self.db.execute(f"INSERT INTO {table} SELECT * FROM {table}")
        self.assertEqual(1, self.count())

    def test_void_reopens_gap(self):
        self.transaction()
        self.transaction(txn=2, kind="ADMINISTRATION_VOID", original=1)
        self.assertEqual(1, self.count())

    def test_latest_correction_resolves_only_effective_date(self):
        self.transaction()
        self.transaction(txn=2, kind="ADMINISTRATION_CORRECTION", date="2026-09-01", original=1)
        self.assertEqual(1, self.count())
        self.transaction(txn=3, kind="ADMINISTRATION_CORRECTION", original=1)
        self.assertEqual(0, self.count())

    def test_not_given_reason_correction_does_not_change_expected_date(self):
        self.transaction(kind="NON_ADMINISTRATION")
        self.transaction(txn=2, kind="NON_ADMINISTRATION_CORRECTION", date="2026-09-01", original=1)
        self.assertEqual(0, self.count())

    def test_conversion_uses_effective_given_date_and_void_restores_not_given(self):
        self.transaction(kind="NON_ADMINISTRATION")
        self.transaction(txn=2, original=1)
        self.assertEqual(0, self.count())
        self.transaction(txn=3, kind="ADMINISTRATION_CORRECTION", date="2026-09-01", original=2)
        self.assertEqual(1, self.count())
        self.transaction(txn=4, kind="ADMINISTRATION_VOID", original=2)
        self.assertEqual(0, self.count())

    def test_count_matches_actual_student_page_reducer(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("Node.js required for parity with student-page JavaScript")
        fixtures, counts = [], []
        self.medication(med=2, student=2)
        self.calendar("2026-09-01")
        cases = [None,
                 (1, 1, "NON_ADMINISTRATION", "2026-08-31", None),
                 (2, 1, "NON_ADMINISTRATION_CORRECTION", "2026-08-31", 1),
                 (3, 1, "ADMINISTRATION", "2026-08-31", 1),
                 (4, 1, "ADMINISTRATION_CORRECTION", "2026-09-01", 3),
                 (5, 1, "ADMINISTRATION_VOID", "2026-09-01", 3),
                 (6, 1, "ADMINISTRATION", "2026-09-01", None),
                 (7, 2, "ADMINISTRATION", "2026-08-31", None),
                 (8, 2, "ADMINISTRATION", "2026-09-01", None),
                 (9, 2, "ADMINISTRATION_VOID", "2026-09-01", 8)]
        for case in cases:
            if case:
                self.transaction(*case)
            sql = self.query(date="2026-09-01")
            expected = self.db.execute(sql[:sql.index(" SELECT COUNT(DISTINCT expected.studentsdcid)")] +
                                       " SELECT medication_id, studentsdcid, expected_date FROM expected_rows").fetchall()
            fixtures.append({
                "medications": [{"medication_id": med, "studentsdcid": student} for med, student in
                                self.db.execute("SELECT id, studentsdcid FROM u_student_medication")],
                "transactions": [{"transaction_id": txn, "medication_id": med, "transaction_type": kind,
                                  "event_date": dt.date.fromordinal(date).isoformat(),
                                  "reversal_of_transaction_id": original} for txn, med, kind, date, original in
                                 self.db.execute("SELECT * FROM u_student_med_inv_txn")],
                "expected": [{"medication_id": med, "studentsdcid": student,
                              "expected_date": dt.date.fromordinal(date).isoformat()} for med, student, date in expected]
            })
            counts.append(self.count(date="2026-09-01"))
        result = subprocess.run([node, str(Path(__file__).with_name("administration_parity.cjs"))],
                                input=json.dumps(fixtures), text=True, capture_output=True, check=True)
        self.assertEqual(counts, json.loads(result.stdout))


if __name__ == "__main__":
    unittest.main()
