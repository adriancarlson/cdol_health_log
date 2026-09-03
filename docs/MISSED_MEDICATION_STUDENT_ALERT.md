# Student missed-medication alert

Introduced in Health Log **26.8.7.16**; icon styling and sizing updated in **26.8.7.18**.
The positional SQL-row FRN link is corrected in **26.8.7.20**.
The borderless orange warning overlay is added in **26.8.7.21**.
In **26.8.7.22** it is enlarged 10%, shifted left, and separated from the bottle
by a transparent gap rather than a painted border.
In **26.8.7.23** the triangle grows another 10%, keeping its bottom-center
position and the matching transparent gap.
No changes to CDOL Custom Alerts, shared
CSS, schema, or permission mappings are required by this student-alert addition.

## Behavior

- Use the same `title_student_end_css` extension point as the Custom Alerts
  Medications Alert. Keep the existing OTC/Rx permission alert separate.
- Show exactly one blue-outlined bottle with a solid blue cap and red plus for the selected student
  when at least one eligible daily administration remains unresolved.
  A solid orange triangle with a white exclamation overlaps the lower-right
  corner, with a transparent separation gap. Display the composite at 28 by 28 pixels while
  keeping the bottle at its existing 21-by-28 scale. The original 15-by-20
  outlined-cap variant is retained as an unused backup.
- Navigate in the same tab to
  `/admin/students/medication/administration.html?frn=~(student_frn)`.
  Inside the SQL row body, placeholders consume returned columns in order;
  their names do not resolve session values. The first and only returned column
  is `'001' || TO_CHAR(MIN(expected.studentsdcid)) AS student_frn`, not the count.
  A native anchor provides keyboard activation; omit `dialogM`.
- Calculate at page render, with no browser request or refresh timer. Refresh or
  navigate to a newly loaded page after resolving the last gap or crossing cutoff.
- Match the school header count's eligibility and effective transaction rules:
  daily frequency, selected year, in-session weekdays, enrollment, strictly after
  first inventory, configured school cutoff, and effective Given/Not Given.
  Latest Given corrections, voids, and Not Given conversions are included.
- Scope to the current student DCID using `~(rn)`, as the reference alert does.
  School filtering matches the student's Administration query:
  `~(curschoolid) IN (0, medication.schoolid)`. At District Office this can show
  an alert for the selected student; the main school counter remains hidden there.
- The admin-directory and existing Administration modify-permission checks enclose
  both SQL and markup on the server. No new access is granted to view-only staff,
  teachers, or parent/student portals. Native student-page access remains required.

The query returns no row when there is no gap and one aggregate row containing
the complete student FRN otherwise. `HAVING COUNT(*) > 0` controls visibility;
the count is not a returned column.
No medication names, reasons, dates, or gap counts are embedded in the alert.
Calculated alerts are not stored and loading the alert performs no writes.

## Sources and maintenance

- `web_root/wildcards/title_student_end_css.missedmedication.student.alert.txt`
- `web_root/images/cdol_health_log/icon-missed-medication.svg`
- Palette/reference:
  `cdol_custom_alerts/web_root/images/img/icon-meds.svg`
- Effective-gap reference:
  `web_root/admin/medication/data/missedMedicationCount.json`

Keep the shared SQL CTEs aligned across the count and student alert. Tests compare
them and execute both queries on the same fictional fixtures. Do not introduce
inventory-balance or discontinuation filters in only one query.

## Local checks

Run `py docs/tests/test_missed_medication_count.py` (26 tests) and
`node --test docs/tests/missed_medication_load_once.test.cjs` (8 tests).
The SQL tests use SQLite date/function substitutes; they do not establish Oracle
execution, PowerSchool tag expansion, or live permission enforcement.

Run `py docs/tests/serve_toolbar.py` and open
`http://127.0.0.1:8769/tests/student_alert.html` for a 28-by-28-pixel composite preview alongside
the reference icon and 15-by-20 backup. The fixture executes the shipped SQL on
fictional records with three missed days, then fills the shipped anchor's fields
by position. It must link to `001900001`, not the count `3`. The fixture does not
emulate PowerSchool's full template engine or security.
Click or press Enter to inspect the local destination and FRN. The resolved-state
fixture omits the link. This fixture is not a PowerSchool authorization emulator.
All fixtures are under `docs` and excluded from installer ZIPs.

## Test-server acceptance

1. Install Health Log 26.8.7.23 and hard-refresh a student page using an authorized
   Medication Administration account. The generated Data Access package has the
   same version but unchanged mappings.
2. Open a student with unresolved Missed rows: one small blue/red bottle should
   appear alongside the existing student alerts, with its descriptive tooltip.
   Multiple medications or missed days must not duplicate the icon.
3. Click the icon, then test keyboard activation. Both must open the full
   Administration page for that same student, not a modal or another student.
   With several missed days, inspect the href: it must end in `001` followed by
   that student's DCID, never the number of missed administrations.
4. Resolve all gaps with Given or Not Given and reload: the icon disappears.
   Resolving only one of several gaps must leave it visible.
5. Check a student with no gaps, PRN-only medications, or no inventory history:
   no icon. Switch between affected and unaffected students without a stale icon.
6. Verify a today-only gap before/after school cutoff on a new page load.
   Confirm weekends, non-session days, first-inventory day, and missing cutoff
   cannot create a false alert.
7. Check corrected dates and entered-in-error administrations against the table.
   Switch years/schools and test District Office student context. Main-header
   behavior and the existing Custom Alerts Medications Alert must be unchanged.
8. Test an account denied Administration modify permission and a teacher login:
   no new student alert or query output. Verify classic and PDS student headers,
   SVG loading, console errors, spacing, and page-load latency on real data.

No live deployment or merge to main is performed by the local build.
