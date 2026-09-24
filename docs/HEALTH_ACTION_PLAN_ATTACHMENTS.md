# Action Plan attachment access

## Supplied plugins reviewed

### Student Document Attachments Preview 2025.08.25.2

The supplied archive contains a page fragment for
`/admin/students/studentattachments.html`, published by Vance M. Allen.
It appends a preview button to the native attachment table before Angular compiles
the rows. The native `fileMetaData` record supplies the attachment ID, filename,
status, creator, and `permission.download` flag. The button is disabled unless the
status is `A`, download permission is present, and the creator is not PowerSchool
Registration Signature.

The preview requests `/ws/k12drive/document/content/<id>` as an array buffer and
opens a Blob URL in an iframe within PowerSchool's `psAlert` dialog. It does not
include the native attachment-list request, category filtering, or a way to find
an authorized Diabetes attachment from another page. Its response handler also
lacks explicit HTTP-error handling and revokes the Blob URL immediately after
assigning it to the iframe. The preview fragment was inspected, not installed or
executed against student documents.

### Document Attachment Alert 22.5

The supplied archive is published by Jay Lindler / Bridgewood Consulting. Its
student-header wildcard checks for `docmetadata` rows for the selected student.
Its dialog groups counts by category using `docmetadatadistrictcategory` and
`districtcategory`, then links to the student's native Attachments page. It does
not resolve a specific document to open or check per-document download permission.

The requested `WEB_ROOT/images/bc-document-icon.png` was copied byte for byte to
`web_root/images/cdol_health_log/bc-document-icon.png`. The namespaced destination
avoids competing with the original plugin's `/images/bc-document-icon.png` path.
SHA-256: `5c1e681a0b6623c86ce161a1b340aa35b24bdfdf020f57a0a5f92b4532727706`.

## Implemented behavior (26.9.7.29)

When Diabetes is Yes and the saved `DIABETES_COLLECTION_METHOD` equals `Upload`,
the Action Plan return-method display shows the copied icon and an **Open student
attachments** link. The accompanying instruction is **Look for category: Diabetes.**
The icon and text open `/admin/students/studentattachments.html?frn=~(studentfrn)`
in a new tab with `rel="noopener"`, preserving unsaved Health History changes.

This is the user-authorized navigation fallback. The page is not automatically
filtered to Diabetes and the link does not claim an upload exists. Return to school
office, blank, and unrecognized values do not show it. Other return-method displays
have no attachment link unless explicitly configured. The parent choice remains
read-only and is never included in form submission.

The native Attachments page handles attachment access and document selection. If
the Preview plugin is installed, its existing preview buttons remain available on
that page. No new SQL, metadata endpoint, document-content request, or permission
grant is added here. A direct preview would require verifying the native category
lookup and per-document permission contract, plus behavior when multiple Diabetes
documents exist; those details are not supplied by either archive.

## Validation

Local AngularJS tests cover Upload-only visibility, blank/unknown/office choices,
the selected-student FRN, icon-click navigation to a mocked Attachments page in a
new tab, a null opener, and the unchanged read-only parent-choice contract. Package
checks compare the icon bytes with the supplied archive and verify the manifest.

Installed PowerSchool verification remains required for the actual field value,
native page permission checks, the Diabetes category, attachment availability,
and the separately installed Preview plugin. No real documents were accessed.

## Production source inspection (2026-09-24)

Read-only inspection of the user-selected native Attachments page confirmed the
following contract in the scripts loaded by production. No attachment content was
requested, and no student records or attachment metadata were changed. This
inspection does not validate a direct preview from Health History.

### Metadata and category lookup

`/scripts/components/docattach/services/docattachSearchService.js` uses:

- `GET /ws/districtcategory`, returning `categories` (an object or array).
- `GET /ws/k12drive/document/aggregates` with `entityname=STCM`, `entityid`,
  and `q`. The result is `documentAggregates`, including `count` and `time`.
- `GET /ws/k12drive/document` with `entityname=STCM`, `entityid`, `page`,
  `pagesize`, `order`, `q`, and a cache-busting `_` timestamp. The result is
  `documents.documentList` (an object or array).

The controller obtains `entityid` by removing the first three characters of the
page's `#frn` value. Follow that native derivation; do not substitute the full FRN
or assume it is the same as another student identifier used by Health History.

`/scripts/docattach/filterdata.js` constructs the category filter as
`category==(<category-id>);status==active`. With the aggregate timestamp, it adds
`lastmodifiedon=le=<time>` before the status clause. Resolve the Diabetes category
by name from the category response instead of hard-coding its production ID.
The native service passes the filter through Angular `$http` query parameters.

### Document fields and access checks

The already-loaded records contain `id`, `status`, `permission.download`,
`documentLocation`, `mimeType`, `name`, `categories`, and `changeList`.
`categories` can be a single object or an array; each category has `id` and `name`.
Normalize both list response shapes and category shapes before filtering.

The native single-download button requires `status === 'A'` and
`permission.download`. The controller additionally marks documents unavailable
when `documentLocation` is present and differs from `L`. The installed preview
fragment uses the content endpoint described above and excludes documents created
by PowerSchool Registration Signature. Its `createdby` field is derived by the
controller from `changeList`, rather than supplied directly by the metadata API.

The inspected account had download permission for both displayed active, local
documents. A denied account and server-side content authorization were not tested;
client-side flags are not a replacement for the content endpoint's authorization.
Handle rejected requests without attempting an alternative access path.

### Selection caveat and proposed integration

The sample showed an older plan tagged Diabetes and a newer plan tagged Medical
and Other. A strict Diabetes-category lookup would return the older plan. Do not
infer the latest valid plan from the filename or silently include other categories.
An upload date also does not establish the doctor's plan date.

For direct preview, look up the current student's authorized Diabetes documents
when the icon is clicked. Display filename and upload information so the admin can
identify the document; allow selection if there are multiple matches. Retain the
native Attachments link for missing matches, unsupported previews, or errors. Only
request content after selection, check HTTP success and content type, and revoke
the Blob URL when the preview closes. These changes were not implemented in
26.9.7.29; the implementation below supersedes that navigation-only behavior.

## Direct picker and preview (26.9.7.30)

The user confirmed that future parent uploads will be categorized Diabetes.
`healthAttachments` now performs the verified native category, aggregate, and
paginated metadata GET requests on icon click, scoped to the explicit student FRN.
An inline picker always asks the administrator to select a document, including
when only one matches. It shows the filename and native formatted upload date;
it does not judge whether the plan satisfies the doctor's date requirement.

The picker excludes inactive documents, documents without an explicit boolean
download permission, unavailable document locations, and Registration Signature
documents. It rechecks category membership in the metadata, deduplicates IDs across
pages, normalizes object/array responses, and uses the aggregate snapshot timestamp.
Malformed responses and request failures show the native-page fallback. An unusually
large result exceeding 10,000 documents also uses that fallback.

Selecting a document requests its content using the current session. Successful,
nonempty PDF or PNG/JPEG/GIF/WebP responses become a Blob iframe preview. Other
types, HTML login responses, and rejected requests never become previews. Blob
URLs stay alive during viewing and are released when replaced, closed, hidden by
a Diabetes answer change, or destroyed. Late content responses after closure have
their Blob URLs revoked without reopening the panel. Metadata/content requests
have a 30-second timeout. No automatic preview, cross-category search, direct S3
request, metadata write, new permission grant, or audit stamp is introduced.

The icon remains Upload-only, and Open student attachments remains a separate new
tab link. Every picker button is `type="button"`; display-only data has no form
submission names. The original native form and saved parent method are preserved.

Local AngularJS 1.4.7 coverage exercises multiple pages, singleton/list shapes,
category and permission exclusions, empty results, missing categories, denied
list/content requests, login/unsupported/empty content, preview cleanup, closure
during an outstanding request, and absence of form submissions or student writes.
Content fixtures are synthetic. Installed preview from Health History and
server-side denied-account behavior still require live verification after install.

Validation completed: the full health-form suite passes with both source and
PowerSchool-rendered field names; JavaScript syntax, repository XML, and diff
whitespace checks pass. Both 26.9.7.30 ZIPs were built, their manifest versions
verified, and the packaged JS/CSS/HTML/icon compared byte for byte with source.
The local picker layout was inspected using synthetic data. The headless tests
verify PDF/image response handling and iframe creation, not the installed browser's
PDF viewer rendering or real production content authorization.
