# Current State

## Action Plan document preview (26.9.7.30)

When the saved diabetes return choice is Upload, the document icon loads the
selected student's active, downloadable Diabetes attachments. An inline picker
shows filenames and native upload dates; choosing a file previews a PDF or common
image without submitting the Health History form. The native Attachments link
remains available for missing files, denied access, unsupported types, and errors.
Category IDs are resolved by name, results are paginated, and Blob URLs are released
on close or context changes. New parent uploads are expected to use Diabetes;
historical categories are not changed. Local validation is documented in
`HEALTH_ACTION_PLAN_ATTACHMENTS.md`; installed Health History validation remains
pending. No new permissions or production record changes are included.

## Action Plan attachment link (26.9.7.29)

Diabetes return method Upload shows the copied document-alert icon and an Open
student attachments link beneath the parent choice. It opens the selected student's
native Attachments page in a new tab, with guidance to look for category Diabetes.
The supplied preview fragment cannot independently resolve a permitted Diabetes
document from Health History, so this uses the user-authorized navigation fallback.
Plugin analysis and installed validation requirements are documented in
`HEALTH_ACTION_PLAN_ATTACHMENTS.md`.

## Action Plan parent return method (26.9.7.28)

The inline Action Plan notice shows the parent's saved diabetes submission method
below the instructions whenever Diabetes is Yes, including school 101. The existing
display moves here from Diabetes Documentation. Disabled Upload / Return to school
office radios show the saved value; blank values show Not recorded. The display
cannot overwrite the parent's choice and is hidden for seizure-only cases.
Installed PowerSchool validation remains pending.

## Action Plan notice instructions (26.9.7.27)

The existing inline Action Plan notice shows the approved DMMP instructions when
Diabetes is Yes, including school 101. The text identifies the student and school,
underlines the provider's form phrase, and highlights the first-week-of-school
deadline. The title stays Action Plan; seizure-only cases keep the general wording.
The separate Diabetes Documentation section and its existing rules remain unchanged.
Installed PowerSchool validation remains pending.

## School-specific daycare card (26.9.7.24)

The Daycare Provider card and phone show only for enrollment school 110. Other
schools show two joined provider cards. Hidden daycare fields are excluded from
submission and change tracking, preserving existing values.
Installed PowerSchool validation remains pending.

## Joined Health Contacts cards (26.9.7.23)

The Physician, Dentist, and Daycare Provider cards touch, using single shared
borders and rounded outer corners in both desktop and stacked mobile layouts.
Installed PowerSchool visual validation remains pending.

## Native Health History Submit button (26.9.7.22)

The bottom Health History Submit button now uses PowerSchool's native styling.
Custom padding, corner radius, and disabled opacity/cursor overrides are removed.
The existing Angular enable/disable and submit behavior is retained.
Installed PowerSchool visual validation remains pending.

## Full-width question grids (26.9.7.21)

The OTC and Medical History question tables fill the available content width and
align left. Card styling and the narrow-screen stacked layout are retained.
Installed PowerSchool visual validation remains pending.

## Health Contacts cards (26.9.7.20)

Physician, Dentist, and Daycare Provider each have a separate card containing the
provider and phone fields. The cards match OTC colors, borders, padding, rounded
corners, and focus styling. They retain the existing three-column layout and stack
on narrow screens. Field bindings and required physician fields are unchanged.
Installed PowerSchool visual validation remains pending.

## Medical History question styling (26.9.7.19)

The seven Medical History Yes/No questions share the OTC medication section's
compact shaded cells, borders, rounded corners, and responsive three-column layout.
Both pages use the same CSS. Existing bindings and submission remain unchanged.
Installed PowerSchool visual validation remains pending.

## Health History emergency authorization removal (26.9.7.18)

The Emergency Authorization section and its physician consent, hospital treatment
preference, and preferred hospital questions are removed from Health History.
Existing saved values remain unchanged. Installed PowerSchool validation is pending.

## Health History alerts (26.9.7.17)

Health Alerts now appears immediately above Sports Participation. Allergy Alert,
Medical Alert, Medical Action Plan Alert, and Concussion Alert retain the native
Alerts page tables, headings, and icon paths. The single allergy input moves into
this section. All seven alert fields use Health History's existing Angular model,
change tracking, native submission, and medical audit stamp. The action-plan and
concussion flags use checked `1` / unchecked `0`.

Both packages are built. AngularJS browser tests passed with source and simulated
PowerSchool field names, including alert initialization, reverts, and submission.
XML, package-content, and diff checks passed. Installed field rendering, checkbox
clearing, heading toggles, icons, and persistence still require PowerSchool validation.

## Faster scroll and borderless prescription question (26.9.7.13)

The smooth post-submit scroll now takes 600ms. The STUDENT_MEDICATION Yes/No
question has no border or shaded background. Both 26.9.7.13 packages are built;
installed visual validation remains pending.

## Medical section wrapper cleanup (26.9.7.12)

Read-only inspection identified a native white fieldset background and a gray
inner wrapper with added margin and padding. The medical fieldset and section
wrapper now have transparent backgrounds, with the inner wrapper spacing removed.
Individual section boxes retain their backgrounds and spacing. Both 26.9.7.12
packages are built; installed visual validation remains pending.

## Gradual scroll and prescription text layout (26.9.7.11)

Verified submits ease the content panel and window to the top over one second
after the loading dialog closes. The animation is canceled when the controller
is destroyed. Browser tests verify intermediate scroll positions. The prescription
Yes/No question no longer has a shaded background, and the Add Medication
instruction starts on a new line. Both 26.9.7.11 packages are built; installed
visual validation remains pending.

## Prescription requirement and bottom Submit (26.9.7.10)

The prescription Yes/No question uses U_STUDENT_ADDITIONAL_INFO.STUDENT_MEDICATION.
The parent form mapping and installed Health History validation metadata confirm
Yes=1/No=0 and a Boolean field. JSON loading and verified schema API saves include
this field. Blank/No hides the instructions, Add Medication, and table; Yes shows
them. No preserves medication records. The question is disabled during medication
edits/audit retries. Add Medication is above the table and the main Submit follows
the signature section. Prescription row saves remain independent.

Browser tests cover visibility, Boolean saves, record preservation, audit isolation,
button placement, CRUD, and post-submit scrolling. Both 26.9.7.10 packages are built;
installed JSON execution and save validation remain pending.

## Rounded OTC outer corners (26.9.7.9)

The compact, joined OTC cards now have 10px rounded outer corners on desktop
and narrow screens. Internal borders stay joined. Both 26.9.7.9 packages are
built; installed visual validation remains pending.

## Compact OTC question cards (26.9.7.8)

OTC cards now touch with shared borders, smaller padding, and tighter Yes/No
spacing. Blank example rows are removed. The subtle background and narrow-screen
stacking remain. Both 26.9.7.8 packages are built; installed visual validation
remains pending.

## Medical Authorization content-panel scrolling (26.9.7.7)

Read-only inspection confirmed that the installed student shell scrolls its
`content-main` panel while the document remains stationary. Verified submits now
reset that panel as well as the window after the loading dialog closes. A browser
regression reproduces the inner scrolling panel, fails with the previous code,
and passes with the fix. Both 26.9.7.7 packages are built; installed save validation
remains pending.

## Medical Authorization OTC question styling (26.9.7.6)

Each OTC medication and its Yes/No choices share a lightly shaded card with a thin
border and spacing between questions. Cards stack on narrow screens; unused cells
stay invisible. Styling is scoped to the OTC table and adds no Bootstrap dependency.
Both 26.9.7.6 packages are built; installed visual validation remains pending.

## Medical Authorization OTC consent wording (26.9.7.5)

The requested parent/guardian consent wording appears beneath the OTC heading and
above its radio buttons, with PowerSchool first-name and school-name substitutions.
The dosage sentence is underlined. Duplicated pasted HTML was removed. Both
26.9.7.5 packages are built; installed visual validation remains pending.

## Medical Authorization native Submit styling (26.9.7.4)

The main Submit button inherits PowerSchool's button and disabled styles without
the custom padding, corner radius, or disabled opacity overrides. Both 26.9.7.4
packages are built; installed visual validation remains pending.

## Medical Authorization submit confirmation (26.9.7.3)

Successful Medical Authorization submits scroll to the top after the save is
verified and the loading dialog closes, making the confirmation visible.
Both 26.9.7.3 packages are built; installed validation remains pending.

## Medical Authorization loading and submit binding (26.9.7.2)

The Medical Authorization root is cloaked and hidden until its initial authorization,
prescription, and dose-unit requests settle. PowerSchool's native `loadingDialog()` /
`closeLoading()` pair replaces inline loading messages and also covers saves and
prescription audit retries. The signature section requires a nonblank, non-null name.

Read-only inspection of the installed PowerSchool `ngSubmitDirective` found that its
non-`pssValidationForm` branch returns the original compile function instead of its
compiled link function. The Medical Authorization form consequently had no Angular
submit listener; the native `submitOnce` handler opened a dialog without an API save.
Both health pages now bind their controller submit handler through `health-submit`.
The API form uses PowerSchool's `noSubmitLoading` opt-out, so its own request lifecycle
controls the dialog. Health History retains its native POST and action URL.

AngularJS 1.4.7 tests reproduce the installed decorator and native loading handler,
verify consent/OTC saves, loading-dialog closure after success/failure, initial hiding,
and absent signatures. Both 26.9.7.2 packages are built; installed save validation is pending.

## Medical Authorization empty prescriptions and signature section (26.9.7.1)

The parent/guardian signature and date have their own `box-round` section and
matching blue header. Both remain read-only, and the section appears when a
parent signature exists.

Read-only inspection of the test server confirmed that the prescription PowerQuery
returns only `name` and `@extensions` metadata when no rows exist. This known
successful envelope now becomes an empty list, showing the no-prescriptions message
and enabling Add Medication when authorization data and dose units are loaded.
Malformed responses, login pages, and error envelopes still fail loading.
AngularJS 1.4.7 tests cover an initially empty list, creating its first medication,
audit stamping, and invalid-response rejection. Both 26.9.7.1 packages are built;
installed validation of this revision remains pending.

## Medical Authorization JSON/API loading (26.9.7.0)

Medical Authorization reads the student's existing consent and OTC fields through
`health/data/medicalAuthorization.json`, binds them to `vm.appData`, and saves only
changed fields plus audit metadata through the student-extension schema API.
Blank saved values remain blank; there is no Enrollment Express consent fallback.
Successful saves require a matching read-back. Prescription audit saves use the
same API and preserve pending main-form edits. The existing attribution rules and
read-only parent signature are retained. Health History keeps native submission,
with its shared binding corrected for PowerSchool-generated field names.

AngularJS 1.4.7 browser tests cover JSON loading, saved/blank/false consent, reverted
edits, Boolean versus String serialization, read-back mismatch, load failure,
student isolation, extension creation, and prescription CRUD/audit retries.
Installed Oracle execution, saves, and authorization checks still require testing
after both 26.9.7.0 packages are installed. See `HEALTH_FORMS_MIGRATION.md` for the
separate Basic First Aid response-to-student-field discrepancy found during diagnosis.

## Confirmed completed work

- Version 26.9.5 moves Medical Authorization and Health History into this plugin under
  `/admin/students/health/`, retaining their Health Profile navigation IDs and sort orders.
  Both pages use PowerSchool's AngularJS 1.4.7 loader, native main-form submission,
  model comparison for audit stamps, and scoped Bootstrap-style form controls.
  Prescription CRUD uses independent inline Angular editors and verified audit-only
  requests with retry support. No schemas are moved. Local AngularJS 1.4.7 browser
  tests pass; installed validation is pending. See `HEALTH_FORMS_MIGRATION.md`.
- Version 26.9.6 maps the supplied Health History form 24779195 export, adding
  seizures, inhaler use, allergies, EpiPen, school-specific document notices,
  dental agreement, and sports follow-ups. Parent document-return methods are
  shown as read-only radio buttons beneath the form links and never submitted. The user-approved inhaler-contract condition is
  enrollment-school 311 and inhaler = Yes. Hidden fields retain their values but
  are disabled for POST and excluded from change comparison. Allergies remain a single editable
  native field saved and audited with the main form; there is no allergy table.
  No schemas change. See `HEALTH_HISTORY_RULES.md`.

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
- Version 26.9.4 adds the school-level **Hide Depleted Inventory Batches** setting. It defaults to off. When enabled, the Medication Inventory page hides normally depleted zero-remaining batches and excludes their effective original quantities from the displayed denominator. It does not change stored lots, transaction history, remaining inventory, FIFO deductions, inventory status, or fully corrected-lot behavior.
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
