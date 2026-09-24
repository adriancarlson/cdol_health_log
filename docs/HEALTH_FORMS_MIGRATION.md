# Medical Authorization and Health History migration

The Health Log plugin now owns these pages:

- `/admin/students/health/medical_authorization.html`
- `/admin/students/health/health_history.html`

The navigation IDs `cdol-medical` and `cdol-health-history`, their Health Profile parent,
titles, and sort orders (50 and 100) are retained. CDOL Student Info 26.9.1.22 supplies
redirects at the old URLs and removes its navigation, query, and medication permission
entries. No table schema is transferred or changed.

## Deployment

Update CDOL Student Info, CDOL Health Log, and CDOL Health Log - Data Access together
on the test server. Verify the old named query is released from Student Info before
enabling its new Health Log owner; the query identifier is deliberately retained.
Check that each navigation link appears only once and that existing security groups
have access to the new page paths. Existing page permission assignments may need
to be carried over to the new URLs. Verify this in the installed system.

Health Log's existing build produces the application package and a separate Data
Access package. The named query travels with the application; the prescription
permission mappings travel with Data Access.

## AngularJS behavior

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

Install both 26.9.7.3 packages: the Data Access plugin adds student-extension POST/PUT
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
methods are disabled radio buttons showing parent-response values with no submission names; this page
does not upload documents or overwrite those parent choices.

Allergies remain a single editable native field saved by the main form, with
actual-change audit stamping. No allergy table, query, or extra permissions are added.
No schema definitions change.

The AngularJS browser tests cover conditional visibility, exclusion of hidden
fields from POST, preservation of hidden values, reverting edits, required input,
prescription CRUD and audit retries, read-only return choices, and native allergy-field submission.
