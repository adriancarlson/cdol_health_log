# Medical Authorization and Health History migration

The CDOL Health plugin (formerly CDOL Health Log) owns these pages:

- `/admin/students/health/medical_authorization.html`
- `/admin/students/health/health_history.html`

The navigation IDs `cdol-medical` and `cdol-health-history`, their Health Profile parent,
titles, and sort orders (50 and 100) are retained. CDOL Student Info 26.9.1.22 supplies
redirects at the old URLs and removes its navigation, query, and medication permission
entries. No table schema is transferred or changed.

## Deployment

Health Log 26.9.7.61 uses `/images/css/cdol.css` from CDOL CSS 26.9.0.3 for
all custom presentation. Install that CSS package first. The local
`healthForms.css` and embedded form styles are removed; future style edits belong
in the shared file's `CDOL Health Log` section. The AngularJS browser fixture also
loads that sibling repository's stylesheet.

Update CDOL Student Info, CDOL Health, and CDOL Health - Data Access together
on the test server. Verify the old named query is released from Student Info before
enabling its new Health Log owner; the query identifier is deliberately retained.
Check that each navigation link appears only once and that existing security groups
have access to the new page paths. Existing page permission assignments may need
to be carried over to the new URLs. Verify this in the installed system.

Health Log's existing build produces the application package and a separate Data
Access package. The named query travels with the application; the prescription
permission mappings travel with Data Access.

## AngularJS behavior

Version 26.9.7.60 retrieves dose units through
`/admin/students/health/data/medicationDoseUnits.json`, guarded by Medical
Authorization page access. The endpoint selects only MED_DOSE_UNIT records with
nonblank codes and nonzero or null visibility; the three returned fields are
code, displayvalue, and uidisplayorder. It uses the same secured tlist_sql JSON
pattern as medicalAuthorization.json. The existing save and audit APIs are
unchanged. Verify the new endpoint and its permission guard after installation.

Prescription Add/Edit rows use the shared prescriptionEditor directive. Local
tests also exercise the attachment cache and refresh behavior in
`docs/tests/health_forms_optimization.test.cjs`, using the same runtime variables
as the main form tests.

Prescription medication instructions sit above a bordered card containing Add
Medication and the table. On load, existing rows for the selected student promote
a saved No or blank STUDENT_MEDICATION answer to Yes after both loads finish.
This is a pending change saved through normal Submit; the original baseline and
subsequent administrator edits are preserved. Empty/failed lists do not promote
the answer. Below the card, the
Prescription Authorization Form block uses native RX_COLLECTION_METHOD and
category Prescription. The three original saved choices are display-only and
remain available when the medication card is hidden. The shared return-method
directive accepts an optional custom option list; existing forms keep their
default choices. No field permissions or API save mappings are added.

The OTC section includes authorization-form instructions and the saved
U_STUDENT_ADDITIONAL_INFO.NON_RX_COLLECTION_METHOD below the medication grid.
This display uses the shared return-method tags and Non-Prescription category
document picker. The value is read from a native token, has no input name, and
is excluded from the API's editable-field list. The exact category spelling is
intentional and matches the user's configuration. Installed validation is pending.

The pages load PowerSchool's RequireJS `angular` module, targeting AngularJS 1.4.7.
They do not ship a second Angular runtime or a global Bootstrap stylesheet.
Scoped styles give the forms Bootstrap-style controls while preserving the native
prescription grid, blue banners, and pencil/minus actions.

Medical Authorization (26.9.7.0) loads the selected student's saved values from
`/admin/students/health/data/medicalAuthorization.json` into `vm.appData`.
The query reads `u_student_additional_info`; Enrollment Express responses are used
only for the existing last-updated attribution, never as a consent fallback.
The endpoint checks Medical Authorization modify permission, the selected student
FRN/DCID, and current-school context (District Office can access all schools).
It returns explicit nulls for unanswered fields and uses Oracle JSON functions
to escape text. Loading failures leave the form unavailable with a retry action.

Consent checkboxes and OTC radios bind directly to Angular string values `1`/`0`.
Unanswered fields remain blank in the model. Only changed fields are sent to
`/ws/schema/table/u_student_additional_info/<studentDCID>`, with the three medical
audit fields in the same request. Boolean schema fields serialize as `true`/`false`
strings; the String(100) Hospital Consent field serializes as `1`/`0`.
An absent extension row uses POST with `studentsdcid`; an existing row uses PUT.
Success requires both an API success result and a matching JSON read-back of the
changed values and audit stamp. An unverified save requires reloading before
another edit. The original parent signature/date remain read-only.

Health History retains native PowerSchool submission. Its shared binding code
now recognizes PowerSchool's generated validation keys after bracketed source
names become `EF-...`/`UF-...`. Generated checkbox companions are excluded from
model initialization. Both pages compare their models against initial values;
reverted changes do not enable Submit or stamp the audit fields.

The prescription editor uses a separate Angular `ng-form`, outside the HTML form.
It requires all four fields and loads active `MED_DOSE_UNIT` codes. Successful
medication changes trigger an audit-only student-extension API save. Read-back audit
values must match before success is reported. An audit failure offers an audit-only
retry that does not repeat the medication write. The original parent signature is
display-only. Prescription declarations and medication inventory remain separate.
Unsaved consent/OTC edits stay in the model and are excluded from prescription audit saves.

Version 26.9.7.1 accepts the PowerQuery's observed zero-row response containing only
`name: students` and `@extensions` metadata as an empty prescription list. Missing
`record` in any other response remains an error. A valid empty list permits adding
the first prescription when the main form and dose units are ready. The parent
signature/date now appear in their own rounded section with the standard blue banner.

## Verification

Version 26.9.7.2 binds submit events with `health-submit` because the installed
PowerSchool decorator does not link ordinary `ng-submit` forms correctly. Medical
Authorization uses `noSubmitLoading` and manages the native loading dialog across
its own requests. The entire page content is cloaked/hidden until initial requests
settle; inline loading paragraphs are removed. Null, blank, whitespace-only, and
literal `null` signatures do not display a signature section. Health History uses
the same submit binding while retaining its native POST behavior.

`docs/tests/health_forms.test.cjs` runs actual AngularJS 1.4.7 with mocked PowerSchool
endpoints in headless Edge. Set `NODE_PATH` to a Playwright installation and
`HEALTH_ANGULAR_TEST_DIR` to a directory containing `angular.js` and
`angular-mocks.js` version 1.4.7. Run `node docs/tests/health_forms.test.cjs`.
Run again with `HEALTH_RENDERED_NAMES=1` to simulate generated native field names
and checkbox companions for Health History.

Installed validation is still required for the new Oracle JSON endpoint, schema
API writes, absent-extension creation, read-back verification, Health History native
field substitution/saving, the relative state emergency include, and permissions.
Version 26.9.7.3 scrolls to the top after a verified Medical Authorization submit
and loading-dialog closure so the save confirmation is visible.

Version 26.9.7.4 uses native PowerSchool styling for the main Submit button.

Version 26.9.7.5 adds the requested parent/guardian consent wording below the OTC
heading, before the radio buttons, with the dosage sentence underlined.

Version 26.9.7.6 visually groups each OTC question and its Yes/No choices with a
subtle background and border. Questions stack on narrow screens.

Version 26.9.7.7 corrects post-submit scrolling to reset PowerSchool's inner
`content-main` panel in addition to the window after a verified save.

Version 26.9.7.50 shares that smooth scroll with Health History. It starts on an
accepted submit while preserving the native POST, then also runs after loading
the returned page when `changesSaved=true`. The return-page marker uses the same
parameter as the existing native confirmation; ordinary loads do not scroll.
Both controllers cancel pending animation work on destruction. Full native
navigation and scroll restoration still require installed validation.

Version 26.9.7.8 joins OTC cards edge to edge and reduces padding and blank space.

Version 26.9.7.10 uses the saved Boolean `STUDENT_MEDICATION` answer to show the
prescription instructions, Add Medication button, and table only for Yes. No and
blank hide them without deleting medication records. The main Submit is below
all sections; prescription row saves remain independent.

Install both 26.9.7.13 packages: the Data Access plugin adds student-extension POST/PUT
routes. These routes apply to the whole extension table, not a per-field allowlist;
test authorized, denied, view-only, and cross-school accounts. The JSON endpoint
requires modify access; view-only Medical Authorization support remains unverified.
No schema definitions change.

Read-only test-server investigation on September 23, 2026 confirmed the original
Hospital Consent display bug: the hidden field held `1`, but the Angular model was
empty because generated names were skipped. A separate Basic First Aid mismatch
was also confirmed: the parent response was checked while the saved student field
was absent from the schema API response. Form 24778944's visible checkbox 43610908
feeds hidden element 24817197, which is correctly configured to map value `1` to
`U_STUDENT_ADDITIONAL_INFO.MED_FIRST_AID_CONSENT`. That mismatch requires response/
approval history investigation; changing the field mapping or inferring consent
from a response is not part of this plugin update. No student data was changed.

Health History's rules and field mappings now follow the supplied Form Builder
24779195 JSON export, with the user-approved exceptions in `HEALTH_HISTORY_RULES.md`.
Physician, dentist, and daycare fields always display. The form's document return
methods are read-only text badges showing parent-response values with no submission names; this page
does not upload documents or overwrite those parent choices.

Allergies remain a single editable native field saved by the main form, with
actual-change audit stamping. No allergy table, query, or extra permissions are added.
No schema definitions change.

The AngularJS browser tests cover conditional visibility, exclusion of hidden
fields from POST, preservation of hidden values, reverting edits, required input,
prescription CRUD and audit retries, read-only return choices, and native allergy-field submission.

Version 26.9.7.14 removes the Medication Authorization section and its
`STUDENT_MEDICATION` Yes/No question from Health History.

Version 26.9.7.15 replaces the sports dropdown with Yes (`1`), No (`0`), and
Yes - With Accommodations radio buttons. The sports question and restricted-activities
label include the student's first name. No shows restricted activities; Yes - With
Accommodations shows both restricted activities and sports accommodations.

Version 26.9.7.16 removes Medical Alert Text (other medical considerations) and
Medical Alert Expiration Date from Health History. Existing saved alert values
are not changed by this page.

Version 26.9.7.17 adds Health Alerts before Sports Participation, with the Allergy,
Medical, Medical Action Plan, and Concussion sections copied from Custom Alerts.
It preserves their native table layout, collapsible headings, and installed icon
paths. The existing allergy input moves into this section and always remains
available. Medical alert text and expiration return within this new section.
All seven controls use the existing Angular binding, change tracking, native POST,
and medical audit stamping. The two alert checkboxes use checked `1` / unchecked
`0`; there is no separate form or API save. Installed validation must verify native
checkbox clearing, field rendering, icons, and heading toggles.

Version 26.9.7.18 removes the Emergency Authorization section and its physician
consent, hospital treatment preference, and preferred hospital questions from
Health History. Existing saved values are not changed by this page.

Version 26.9.7.19 gives all seven Medical History Yes/No questions the OTC section's
compact shaded cells, shared borders, rounded corners, and three-column layout
that stacks below 761px. Both pages use the same question styles in
`healthForms.css`; field names, values, visibility rules, and submission are unchanged.

Version 26.9.7.20 styles Physician, Dentist, and Daycare Provider as three separate
cards, each containing the provider and phone fields. They use the OTC background,
border, padding, corner radius, and focus color, retaining the existing responsive
contact grid and field behavior.

Version 26.9.7.21 makes the OTC and Medical History question tables fill their
available content width with no centering margin, retaining their card styling
and stacked layout on narrow screens.

Version 26.9.7.22 removes Health History's custom Submit button appearance so it
inherits native PowerSchool button styling, including its disabled state. Angular
validation, change tracking, and native submission remain unchanged.

Version 26.9.7.23 joins the Physician, Dentist, and Daycare Provider cards edge to
edge with single shared borders and rounded outer corners. They remain joined
when stacked on narrow screens.

Version 26.9.7.24 shows the Daycare Provider card and both fields only when
`U_STUDENT_ENROLLMENT_LOGIC.PSEE_SCHOOL_ID` is 110, consistent with other Health
History section rules. Hidden daycare fields are excluded from submission and
change tracking without clearing saved values. Other schools show two joined
contact cards, with the Dentist card forming the rounded outer edge.

Version 26.9.7.25 places `ie. Physical Education` directly below the restricted-
activities question label, above its text box, as smaller supporting text.

Version 26.9.7.26 adds the parent-supplied OTC medication statement to Medical
Authorization's introductory OTC paragraphs, including the school-policy exception
for medications provided for general use.

Version 26.9.7.27 replaces the inline Action Plan notice's wording when Diabetes is
Yes with the approved administrator-facing DMMP instructions and student/school
names. The title remains Action Plan. The provider's form phrase is underlined,
and the first-week-of-school deadline is highlighted. Seizure-only cases retain
the general wording. The separate Diabetes Documentation section, its school rules,
reference links, and parent's read-only return method remain unchanged.

Version 26.9.7.28 moves the parent's diabetes return choice into the inline Action
Plan notice below the DMMP instructions. It reads `DIABETES_COLLECTION_METHOD`
and displays disabled Upload / Return to school office radios, or Not recorded
when blank. The choice is never included in form submission and appears only once.

Version 26.9.7.29 adds the supplied document-alert icon beside an Open student
attachments link when the diabetes return method is Upload. It opens the selected
student's native Attachments page in a new tab and identifies Diabetes as the
category to look for. This uses the requested fallback because the supplied preview
fragment depends on document IDs and permissions from the native attachment table.
See `HEALTH_ACTION_PLAN_ATTACHMENTS.md` for plugin analysis and validation scope.

Version 26.9.7.32 removes the old Diabetes Documentation section and its school
101 exclusion and school 310 document-link substitution. The standalone Action
Plan section introduced in 26.9.7.31 supersedes that workflow at every school.

Version 26.9.7.30 adds an inline Diabetes document picker and PDF/image preview,
using the native metadata/category contract inspected on production. It resolves
the category by name and the student from the FRN, handles all result pages, checks
active/local/downloadable status, and keeps the native Attachments link. It never
writes attachment metadata, changes the parent's method, or automatically chooses
a plan. Future parent uploads are expected to have category Diabetes. Existing
uncategorized or differently categorized documents remain on the native page.
