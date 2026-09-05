# Current State

## Confirmed completed work

- A PowerSchool extension XML exists.
- The XML defines:
  - `u_student_medication`, a student child table for medication definitions.
  - `u_student_medication_inventory`, a standalone table for inventory lots.
  - `u_student_med_inv_txn`, a standalone append-only inventory and administration activity table.
  - `u_cdol_health_option`, a shared standalone table for categorized Health workflow options.
- The schema includes medication name, dose, dose unit, inventory unit, frequency, route, audit user/date, notes, and immutable quantities received. Remaining quantities are derived rather than stored.
- The data model direction of one medication to many inventory lots has been established.
- The repository schema defines the append-only `u_student_med_inv_txn` inventory transaction table.
- Existing inventory lots are read-only in the drawer; refills create new lots.
- Parent pickup and other approved removals create one medication-level transaction and display in the Inventory Activity table at the bottom of Edit Inventory.
- Lot balances and total available inventory are derived by applying the net transaction quantity to immutable received lots in FIFO order.
- Added in Error and Wrong Number Entered removals are classified as inventory-entry corrections. They reduce the effective received quantity and displayed denominator FIFO without changing stored lots or transactions, and the low-inventory calculation caps its replenishment baseline at that effective quantity. Fully corrected lots are hidden only from the main quantity display; normally depleted lots remain visible, and all original records remain in Edit Inventory and Inventory Activity.
- The medication definition includes an automatically maintained replenishment baseline. Nurses do not configure per-dose inventory quantities or alert percentages.
- The inventory page calculates Normal, Low, Critical, and Out states from fixed 20% and 10% thresholds. Normal has no visible indicator and percentages are not displayed. The full warning label is left-aligned and the quantity is right-aligned on the single inventory row or on the Total row when multiple lots exist; Out of Inventory uses a subtle pale-red treatment. Adding inventory resets the baseline; deductions do not.
- The main page labels creation as `Add Medication`; the edit drawer uses `Add Inventory` for additional count-in rows on an existing medication.
- Add/Edit Medication prevents duplicate definitions for the same student when normalized medication name, numeric dosage amount, and dose unit match, while allowing the same name with a different dosage or dose unit.
- Medication-name spacing is normalized on blur and before save by trimming the ends, collapsing repeated internal spaces, and capitalizing the first character while preserving the remainder of the entered capitalization.
- Medication dose unit, inventory unit, route, frequency, and removal type dropdowns load Active values from `u_cdol_health_option` categories `MED_DOSE_UNIT`, `MED_INVENTORY_UNIT`, `MED_ROUTE`, `MED_FREQUENCY`, and `MED_REMOVAL_TYPE`. A fresh table remains empty until a district administrator adds or imports values.
- Each dropdown's italicized `Other` action temporarily replaces that dropdown with a text field, plus button, and Cancel button. A successful plus action restores the dropdown with the new value selected; Cancel restores it without creating a value. The plus action trims and normalizes the value, stores the same first-letter-capitalized text as Display Value and Description, and generates a lowercase Code with all whitespace removed. Display Value/Description are limited to 100 characters, Code is limited to 40, duplicates select the existing option, and similar values display the shared advisory reuse warning while the user types.
- Add/Edit Medication accepts only Active values from the four medication-definition option categories. Remove Inventory accepts only an Active `MED_REMOVAL_TYPE` value. The medication fields and removal transactions store stable option codes while the UI resolves their current display labels.
- `/admin/district/healthsetup/cdolhealthoptions.html` provides the district CDOL Health Code Sets manager. It follows the native Code Set pattern with a category selector, conditional Show Inactive checkbox and count immediately before Add Code, Sort Alphabetically and Add Code actions, value table, and edit drawer. The table displays Created By immediately after Display Value and each option's computed usage count immediately after Status, including medication definitions, medication transaction snapshots/removal types, and Health Log references. Administrators can add codes, change display labels, mark values Active or Inactive, reorder the main grid with Move up and Move down buttons, or alphabetize the selected code set. Alphabetical sorting works for every custom health code set and sorts the Active and Inactive groups separately. Inactive values are hidden by default; when shown, they remain below all Active values and reorder only within the Inactive group. The Add drawer warns about similar existing values after ignoring capitalization, punctuation, common filler words, and common destination-action words, while leaving Save available for an intentionally distinct value; exact duplicates remain blocked. The drawer places Display Value, Code, and Active on one aligned row, with the Active checkbox centered below its label, and displays Created By, Created On, Modified By, and Modified On as read-only audit information when editing an existing option. Created On and Modified On use AngularJS date formatting as `MM/dd/yyyy h:mm a`. Display order is assigned automatically and is not typed in the drawer. Codes are immutable after creation and rows are not deleted.
- PowerSchool supplies the shared option table's ID and standard created/modified audit columns. The application does not submit those fields.
- Enhanced Navigation catalogs the manager under **District Management → Health**, after native Health Code Sets, using `districtLevelContext = 2`. The page also displays a District Office-only warning instead of the manager when rendered outside District Office context.
- Inventory quantities use spaced remaining/original formatting such as `2.75 / 5 Pills` for readability.
- Add/edit and removal use one PowerSchool drawer with internal modes so medication context is preserved.
- Reversal is not exposed in the nurse-facing inventory workflow. A future correction workflow must be designed separately from medication physically returning to school.
- The full inventory workflow has been validated successfully on the PowerSchool test server, including medication creation, required inventory, multiple inventory rows, read-only lots, additions, FIFO deductions, insufficient-inventory blocking, decimal quantities, warning thresholds, duplicate prevention, and medication-name normalization.
- The initial student-specific Medication Administration page is implemented as one Administer Medication button followed directly by a simple administration-history table. Inventory is not displayed on the page. The drawer limits medication selection to medications with inventory available and records administered date/time, quantity, staff member, and notes. Routine administrations save directly without a redundant confirmation modal; required-field validation, available-inventory validation, save-in-progress protection, and inline medication details remain in place.
- Version 26.9.3 adds PowerSchool List and Chart tabs to that same page. List remains the default and preserves the
  existing table and controls. Chart is a read-only annual summary that combines all medications, derives its statuses
  from the existing effective administration reducer, and loads school-year session and enrollment classifications from
  `data/administrationCalendar.json` only when the Chart tab is opened. It prints through PowerSchool's built-in print
  action as a one-page US Letter landscape record with medication, staff-initial, and calendar legends. Its medication
  filter appears above the chart title, defaults to All Medications, and can rebuild the chart and legends for one selected
  medication. Medication keys use the first three letters of the medication name, staff initials use italic signature-style
  text, and all legends appear below the calendar. The compact chart header left-aligns a prominent student name, grade,
  and translated gender line. The line is 16 pixels on screen and 8 points in print, retains the same small top gap in both views, and continues with Medication / Dosage and its
  comma-separated list, whose three-letter codes are bold. Month names fit the first column; weekend `W` and no-school
  `NS` markers are enlarged and centered; and `NS` is labeled `No School` in the calendar key. Chart-only print
  preparation mirrors the Emergency Quick Sheet boundary pattern so PowerSchool's header, student banner, page title,
  navigation, tabs, and controls are excluded from the printed record.
  When two administering staff members share first-and-last initials, the chart adds their available middle initials,
  includes their middle names in the staff legend, and gives the readable Lucida Handwriting signature font to staff with fewer entries.
  The matching staff member with the most effective Given entries retains the primary signature font.
  This uses the existing administration response and does not add a page-load request.
- The Administer Medication button remains visible even when no medication is available. In that case, the drawer explains that medication must first be added through the Medication Inventory page. The administration drawer uses compact spacing consistent with the other medication drawers.
- The administration drawer repeats the Inventory page's warning colors in compact status pills. Available Inventory shows the medication's current non-normal status. The Quantity Administered pill recalculates live from the projected inventory remaining after the entered quantity, so it can change from Normal to Low Inventory, Critical Inventory, or Last of Inventory before saving. Last of Inventory uses the Out styling but accurately describes administering the remaining amount. Invalid or excessive quantities do not show a projected pill, the no-available-medication message displays Out of Inventory, and Normal remains unmarked.
- The Inventory and Administration grid toolbars provide matching low-emphasis, left-arrow navigation links while keeping Add Medication and the Administration page's Administer Medication button as the primary actions. Administration links to `← View Medication Inventory`; Inventory links to `← Administer Medication`; and all links preserve the current student's PowerSchool FRN. The no-inventory administration drawer guidance also links directly to that student's inventory.
- When history contains more than one medication definition, the administration table provides a medication filter that distinguishes medication name and prescribed dosage.
- Each given administration is stored as one `ADMINISTRATION` row in the existing inventory transaction ledger. The row contains medication-detail snapshots and its negative quantity is consumed by the same FIFO calculation used for other deductions.
- Administration history includes an Actions column matching the Health Log pattern. The pencil opens an auditable Correct Administration drawer; the minus opens an Entered-in-Error drawer whose Save action requires confirmation. Corrections never PUT or DELETE the original administration.
- The correction drawer uses the same full-width alternating row layout as the administration and inventory drawers. Its summary and date/staff rows are gray, quantity and notes rows are white, and the required correction reason is visually separated in a light-blue section that follows the PowerSchool `feedback-info` color treatment without presenting it as an informational message.
- `ADMINISTRATION_CORRECTION` rows store the corrected administration snapshot and apply only the inventory quantity difference. `ADMINISTRATION_VOID` rows restore the current effective quantity. Both reference the original administration, require a reason, and capture the correction's date, time, and user. History shows one effective row labeled Corrected or Entered in Error, retains the correction audit details, and disables further actions after an entry is marked Entered in Error.
- The final Entered-in-Error confirmation dialog uses padded message content so its warning text and action buttons are not crowded against the dialog edges.
- The Edit Inventory drawer labels its transaction table `Inventory Activity`. It includes administrations, removals, entered-in-error offsets, and quantity-changing corrections, while excluding documentation-only administration corrections whose inventory delta is zero. Correction activity shows the correction date, correcting user, and correction reason. Corrected original administrations use the same compact status pill as Administration history; Entered in Error uses the red warning version.
- Successful routine administrations, corrections, and entered-in-error actions display a PowerSchool `feedback-confirm` message inside the rounded administration table container. It clears automatically after five seconds through a browser timer that explicitly schedules the Angular UI update.
- Health-log and active-staff reads are served by SQL-backed JSON pages in this plugin.
- The application no longer calls the `net.cdolinc.health.healthLog.logs` or `net.cdolinc.health.healthLog.staff` PowerQueries at runtime.
- The internal schema API permission mappings formerly supplied by `cdol_health_log_pqs` are maintained in this repository. Medication custom-page writes do not require external API field access requests.
- The default VS Code build creates two installable plugins from the one repository and source `plugin.xml`: the main plugin without `permissions_root`, and a `CDOL Health Log - Data Access` plugin containing the permission mappings without `user_schema_root` or application files.
- PowerSchool rejects `/ws/district/codeset` as a target in a plugin permission-mapping file because that file cannot grant access to core-resource routes. Medication and Health Log option reads and additions use the internal schema API for `u_cdol_health_option`. The Health Log page receives only GET and POST access; option maintenance remains on the district manager.
- Shared schema API reads request every 100-record page so imported and newly added options remain visible after the option table exceeds PowerSchool's default first-page limit.
- Medication Administration Settings uses the standard PowerSchool admin page structure with School Setup breadcrumbs, a visible page heading, a rounded cutoff section, and an explicit unconfigured state. The cutoff appears in PowerSchool's two-column settings-table pattern with a bold label and separate value column. The time field uses an `HH:MM AM/PM` placeholder so an example value cannot be mistaken for a saved cutoff, and the controls do not depend on a newly introduced controller property that can be absent when PowerSchool retains an older cached script.
- New Health Log records use Active options from `HEALTH_COMPLAINT`, `HEALTH_DESTINATION`, and `HEALTH_CONVERSATION`. Complaint and Destination store one code and retain the italicized `Other` workflow. Communication Methods display active options as checkboxes, require at least one choice, and store selected codes comma-separated in `conversation_type`; `+ Add communication method` creates and immediately checks a reusable method. All three inline add controls display the shared advisory reuse warning for similar existing options while the user types. History resolves combined codes to comma-and-space-separated labels. Save remains disabled while any add is open, pending, or failed. Treatment remains free text, Sport continues to use PowerSchool's native `Sports` Code Set, and `HEALTH_SPORT` is not exposed by the custom manager.
- Existing Health Log values are resolved by code or case-insensitive display value without bulk conversion. Active matches show the dropdown or checked communication methods while preserving the original stored value unless a selection is deliberately changed. A communication value is split on commas only when every segment resolves to a known method. Inactive matches and unmatched historical values display read-only and remain unchanged when another field is edited. History falls back to the original text when a value cannot be resolved.
- `docs/u_cdol_health_option_defaults.csv` contains the approved Medication and Health Log import values, including the expanded complaint list and Recess. Conversation Type defaults are Email, Phone, and In Person. `docs/u_cdol_health_option_removal_type_defaults.csv` separately contains the five former hard-coded removal choices with their original stable transaction codes plus `WRONG_NUMBER_ENTERED`. `docs/u_cdol_health_option_not_given_reason_defaults.csv` provides a focused import of Ill, Refused, and Absent for missed-administration testing. The italicized `Other` UI action is not stored.
- Daily medication gap detection is implemented for the controlled `daily` frequency code. It derives expected rows
  from the medication school's year term, `Calendar_Day` in-session flag, weekday, student enrollment, first inventory
  date, and per-school daily cutoff. A missing cutoff displays a configuration warning and suppresses calculated gaps.
- Unresolved gaps appear as red Action Required rows in Administration history. The weekday appears with the date,
  the Status column shows a `Missed` pill, and the Action Required resolution button is in the Actions column. The
  resolution drawer can create a backdated Given transaction or a stored Not Given transaction with a required
  controlled reason. Not Given rows use one `Not Given: reason` status pill while event notes remain in the Notes
  column. Correction-status pills are not repeated in the Medication column. Missed uses the light-red status style,
  Entered in Error uses the stronger dark-red style, and Corrected uses a light-blue feedback-note style across the
  entire row and its status pill.
- `MED_NOT_GIVEN_REASON` is district-managed and uses the same italicized `Other` add-new action as other medication
  code sets. The approved import defaults are Ill, Refused, and Absent; no Student-prefixed values or stored Other
  value are included.
- Not Given rows store stable reason codes and label snapshots. Reason corrections and later conversion to Given are
  append-only, and the Administration page computes the effective state while retaining audit history.

## Attendance-based automatic absence processing (planned)

The user approved next-morning processing after the overnight attendance refresh on September 3, 2026. This process
will be independent of the school's Daily Medication Cutoff Time, and the school settings page must state that
distinction clearly. The existing cutoff-based alerts remain unchanged.

Read-only test-server Data Dictionary inspection confirmed `PS_ATTENDANCE_DAILY.PRESENCE_STATUS_CD` and
`PS_ADAADM_DEFAULTS_ALL` fields for student/date/school, default attendance and conversion modes, `ATTENDANCEVALUE`,
and `POTENTIAL_ATTENDANCEVALUE`. Definitions alone do not validate the percentage calculation, current data freshness,
or query execution. The reporting-view and backing-table descriptions of potential attendance require reconciliation
against sample results.

The scheduled worker, automatic-absence settings controls, and automatic submissions are not implemented. Required
future settings-page wording is recorded in `REQUIREMENTS.md`; remaining decisions and validation gates are in
`OPEN_WORK.md`. No new processing time, external service, or medication write has been configured.

## Administration quantity label (26.8.7.26)

The Administration table passes the effective administered quantity to the
`pluralize` filter. Quantities of 1 or less display the singular unit (`1 Pill`,
`0.5 Pill`, `0.25 Pill`); quantities above 1 retain the existing plural behavior.
This supersedes the 26.8.7.25 rule that only singularized exactly 1. Numeric strings
such as `1.0` and `0.25` are supported; missing or invalid counts keep the legacy behavior.
The default inventory labels Pill, Tablet, Capsule, Milliliters, Milligrams, and
Units also work when their display label is already plural. Custom labels and
abbreviations are preserved for singular quantities rather than guessing their grammar.
Other callers that omit the quantity keep their existing behavior. No stored
records, prescribed dosage labels, missed/not-given dashes, or inventory math change.
Regression coverage: `tests/medication_quantity_label.test.cjs`.

## Resolve drawer time input (26.8.7.24)

Time Given uses PowerSchool's `pss-time-widget` directive and keeps its Given
row mounted with `ng-show`. The legacy class-only input was created after drawer
initialization, so it missed the native widget wrapper, compact width, and clock
padding. Keeping the input mounted alone was insufficient; the native directive
explicitly initializes the widget.

A browser-only template override on the test server confirmed the same 86px
content width and 20px left padding as Administer Medication. Given/Not Given
toggles preserve the typed time and one widget wrapper. No records were saved and
no server files were changed. Time conversion, validation, date, staff, and
inventory logic are unchanged. Template regression checks are in
`tests/test_resolve_time_input.py`; install the package for final acceptance.

## School-level header counter

The school-level header counter is implemented in version 26.8.7.15. It counts
distinct students with unresolved daily administrations using the existing
calendar/cutoff/enrollment and effective transaction rules. It uses the selected
school/year, is absent at District Office, links to the missed daily administration
report at `/admin/reports_pscb_dev_pro/health/cdol_missed_daily_administration.html`, and reuses
Medication Administration modify permission in both the footer and endpoint.
The matching shared badge stylesheet is supplied by CDOL CSS 26.8.0.4, with a
native-height icon container and a circular single-digit badge. Local
SQL-behavior, student-reducer parity, and browser fixture checks pass; live
PowerSchool authorization, Oracle execution, and toolbar integration still need
test-server validation. See `MISSED_MEDICATION_HEADER.md`.
The count now loads once per page, matching Enrollment Express; no timer, focus,
visibility, or back/forward-cache refresh is registered.

## Student missed-medication alert (26.8.7.23)

The new `title_student_end_css.missedmedication.student.alert.txt` extension
renders a single student alert only when its server-side query finds unresolved
daily administrations for the selected student. It follows the Custom Alerts
placement pattern, with a native same-tab link to Administration retaining the
student FRN. No dialog, timer, AJAX request, persisted alert, or new schema is added.
The student icon has a solid blue cap, blue-outlined body, red plus, and overlapping
orange warning triangle with a white exclamation. The triangle is 21% larger than its initial size and
shifted left, with a transparent knockout gap separating it from the bottle. It displays
at 28 by 28 pixels while keeping the bottle's 21-by-28 scale. The original outlined-cap icon is saved as
`icon-missed-medication-outline.svg`; the white header asset is unchanged.
The existing admin-portal and Administration modify-permission gates enclose the
query and markup. School/year filtering matches the student Administration page,
including its District Office student context; the main header stays school-only.
Local SQL/parity tests and small-icon/link browser checks pass. Live PowerSchool
template expansion, security, placement, and query latency still need testing.
See `MISSED_MEDICATION_STUDENT_ALERT.md`.

The SQL row returns the complete FRN as its first/only column, constructed as
`'001' || TO_CHAR(MIN(expected.studentsdcid))`. The row's `~(student_frn)`
placeholder consumes that value positionally; it does not read a session tag.
The former count output could incorrectly create `frn=3` for three missed days.
The href's missing closing quote is also fixed. The local fixture now executes
the actual SQL and substitutes positional values instead of hard-coding an FRN.

## Prior implementation status reported in ChatGPT

The most recent recovered implementation summary stated:

- The medication definition table exists.
- The inventory-lot table exists.
- An inner inventory-lot UI and save workflow was still missing.
- The medication drawer did not yet include the `inventory_unit` input.
- Creating a medication did not yet POST or create the first inventory lot.
- The next implementation step was to add inventory-lot UI/save logic and create the first lot when a medication is created.

## Not confirmed as completed

The available project files do not prove completion of:

- Live PowerSchool installation and validation of the initial Medication Administration page and `ADMINISTRATION` transaction fields
- Live PowerSchool validation of the missed-dose calendar query, school cutoff settings, and Not Given workflows
- Reminder scheduling
- Controlled-medication reconciliation
- Authorization enforcement
- Server-side concurrency protection against simultaneous inventory removals
- Automated tests
- Packaging and installation validation of the new Medication Administration version

## Source files

The medication inventory, health-log pages, JavaScript services, SQL-backed JSON pages, schema, and permission mappings are present in this repository.
