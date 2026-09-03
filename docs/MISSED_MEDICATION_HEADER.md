# School-level missed medication counter

## Scope

- Count **distinct students** with at least one unresolved daily administration
  in the selected school's selected school year. Multiple medications, days,
  overlapping enrollment rows, or calendar rows do not multiply a student.
- Follow the student Administration page's eligibility rules: controlled `daily`
  frequency, school/year term, weekday, in-session calendar day, enrollment dates,
  and dates strictly after first inventory. A refill does not restart the clock.
- Past eligible days count before today's cutoff. Today counts only when the
  school's configured cutoff is reached, using the same Oracle server time as
  `expectedAdministrations.json`. Missing cutoff suppresses gaps. Like that
  existing query, the effective setting is the highest-ID row with a non-null
  cutoff; no setting behavior is changed by this feature.
- An effective Given or Not Given resolves that medication/date. Corrected Given
  uses the latest effective date. Entered-in-Error Given does not resolve a gap.
  Conversion from Not Given to Given suppresses the original Not Given only
  while the linked Given remains effective. Voiding that conversion restores
  the original Not Given, matching the student page.
- Do not filter by remaining stock or add discontinuation rules here. Those
  would disagree with current student Administration behavior.
- Never show at District Office. No combined district count is provided.
- Hide when zero or unavailable. A request failure is not treated as a confirmed
  zero. No student identifiers, medication names, or reasons are returned.
- The icon and badge link in the same tab to
  `/admin/reports_pscb_dev_pro/health/cdol_missed_daily_administration.html`.
  The report remains owned by the separate CDOL custom reports plugin. This
  header navigation does not implement the report or a new notification setting.
  Student alerts are documented separately in `MISSED_MEDICATION_STUDENT_ALERT.md`.

## Integration

Both `admin_footer_css.missedmedicationcount.content.footer.txt` and
`admin_footer_frame_css.missedmedicationcount.content.footer.txt` include
`missedmedicationcount.txt`, following the existing CDOL footer extension pattern.
The counter inserts a `pds-app-action` before the final toolbar action (Help),
as Enrollment Express does. It uses the duotone white bottle SVG already chosen.

As of 26.8.7.13, the JS requests the count once at document ready, matching
Enrollment Express. Duplicate footer rendering in the same document does not
repeat the request. There is no polling, focus/visibility refresh, or back/forward
cache refresh. Navigate to a newly loaded page or reload to recalculate after the
cutoff or a medication change. The request times out after 20 seconds and never includes
client-supplied school/year filters. The SQL binds `~(curschoolid)` and
`~(curyearid)` from the PowerSchool session and rejects school zero through its
scope filter. It performs no writes.

The school footer and count endpoint independently use the existing PowerSchool
`security.pagemod=/admin/students/medication/administration.html` check. This is
a conservative reuse of permission to modify Medication Administration, not a
new grant to ordinary staff or a hard-coded nurse role. View-only users are not
included. The final nurse/security-group policy is still an open project item.
**Verify this tag for both authorized and denied users on the test server before
release.** A denied request returns `{"authorized":false}` without running SQL.

## Shared CSS dependency and packages

The example plugins still embed their badge CSS; it was not present in CDOL CSS.
The matching reusable styles now live in the CDOL CSS repo's
`web_root/images/css/cdol_toolbar_counts.css`. A narrow stylesheet is loaded by
the wildcard so standard PowerSchool pages do not have to load all of `cdol.css`.
Existing Staff Change, Duplicate Contacts, and Enrollment Express files are not
changed. The shared stylesheet is on `codex/missed-medication-toolbar-styles`.

CDOL CSS 26.8.0.3 matches the native 32px PDS icon container, with the 20px bottle
centered inside it. The badge uses border-box sizing so padding is included in
its 16px minimum width/height: one digit is circular, while longer counts expand
only as needed. Its top aligns with the container top, like Enrollment Express.
The former 20px container raised the artwork 6px above its neighbors; the former
content-box minimum width plus padding made one digit 24px wide by about 15px high.

CDOL CSS 26.8.0.4 preserves the icon dimensions when rendered as a native link,
removes PowerSchool's extra anchor padding, and adds pointer/focus feedback.

Install **CDOL CSS 26.8.0.4** and **CDOL Health Log 26.8.7.23** on the test server.
The build also creates **CDOL Health Log - Data Access 26.8.7.23**; its permission
mappings are unchanged in this update. No new schema is required for the counter.
Nothing is merged to main or deployed automatically.

## Local checks

- `py docs/tests/test_missed_medication_count.py`: 26 tests against the shipped SQL
  CTEs, including a 10-state comparison with the actual student-page JavaScript
  history reducer, plus student-alert scoping and source contracts. Each school
  count assertion also executes the student alert SQL for each fictional student
  and checks that the number of visible student alerts equals the count.
  Node.js must be on PATH for the reducer comparison.
- The SQL test uses SQLite with ordinal dates and Oracle-compatible TRUNC/NVL
  substitutes, then removes only the JSON output envelope. This checks behavior,
  not live Oracle parsing, execution plans, or PowerSchool template rendering.
- `py docs/tests/serve_toolbar.py`, then open
  `http://127.0.0.1:8769/tests/toolbar.html` and choose **Run UI checks**: 25 checks
  cover numeric counts, encoded/array JSON, zero/invalid/denied/error responses,
  duplicate footer rendering, toolbar placement, accessible text, and absence of
  focus/visibility/restore refreshes. All fixture counts are fictional; there is
  no PowerSchool connection. The fixture mirrors native 32px toolbar containers
  and checks alignment and badge geometry for 1-, 2-, and 3-digit counts.
  It also verifies the exact report URL, native same-tab keyboard link, and
  pointer/padding styles. Clicking the local link opens a clearly labeled test
  destination, not a copy of the report.
- `node --test docs/tests/missed_medication_load_once.test.cjs`: eight lifecycle
  checks verify one request per page load, no background timers/event handlers,
  duplicate-footer suppression, and no automatic retries after failures.
- All tests and the fixture server live under `docs`, excluded from install ZIPs.

## Test-server acceptance

1. Install both updated application/style packages, hard-refresh, and sign in
   with a staff account allowed to modify Medication Administration.
2. Select a school and the medication's school year. Confirm the header count
   equals the number of distinct students whose Administration pages contain
   unresolved Missed rows. Several gaps for one student must still add only one.
3. Use a student whose **only** unresolved expected dose is today. Before the
   cutoff, that student adds zero; at/after the cutoff, the student adds one after
   a new page load or browser refresh. Leaving a page open or returning focus does
   not recalculate the count. An older unresolved day still
   counts before today's cutoff. Do not change the production clock.
4. Resolve one of several gaps: count stays the same. Resolve the student's last
   gap with Given or a Not Given reason: count drops by one on refresh. Void a
   standalone Given: its gap returns. Check corrections that move the event date.
5. Check weekends, non-session days, first-inventory date, PRN medication, missing
   cutoff, and another school with a different cutoff. Those must match the
   existing student-page results, not invent new gaps.
6. Switch to District Office: no medication icon or count request. Switch schools
   and years: only the selected context is counted. Click the icon or badge, and
   activate it with Enter from the keyboard: each must open
   `/admin/reports_pscb_dev_pro/health/cdol_missed_daily_administration.html`
   in the same tab. The report plugin must be installed and its own page
   permissions granted separately; this link does not grant report access.
7. Test an account denied Medication Administration access. It must receive no
   icon, and directly opening `/admin/medication/data/missedMedicationCount.json`
   must return access denied, not a count. Verify query parameters cannot change
   school/year scope. Test the intended view-only policy before broad rollout.
8. Confirm the SVG/style load successfully, no console errors occur, and the
   icon does not duplicate or overlap existing header alerts in classic/PDS and
   framed/non-framed navigation. Check 1-, 2-, and 3-digit counts.
9. Measure count-endpoint latency on a populated school before broad rollout;
   each page load makes one request, with no background polling. Live Oracle performance and
   permission behavior are not established by local checks.
