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

PowerSchool-rendered values initialize Angular models before controls render.
The main form uses native PowerSchool submission and compares the complete model
against its initial values. `$dirty` remains available for interaction state;
reverted changes do not enable Submit or stamp the audit fields.

The prescription editor uses a separate Angular `ng-form`, outside the HTML form.
It requires all four fields and loads active `MED_DOSE_UNIT` codes. Successful
medication changes trigger an audit-only form POST. The returned server audit
values must match before success is reported. An audit failure offers an audit-only
retry that does not repeat the medication write. The original parent signature is
display-only. Prescription declarations and medication inventory remain separate.

## Verification

`docs/tests/health_forms.test.cjs` runs actual AngularJS 1.4.7 with mocked PowerSchool
endpoints in headless Edge. Set `NODE_PATH` to a Playwright installation and
`HEALTH_ANGULAR_TEST_DIR` to a directory containing `angular.js` and
`angular-mocks.js` version 1.4.7. Run `node docs/tests/health_forms.test.cjs`.

Installed validation is still required for PowerSchool field substitution and
saving, the relative state emergency include, code-set permissions, audit POST
response values, and navigation/catalog ownership during the upgrade.

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
