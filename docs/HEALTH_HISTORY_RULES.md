# Health History form mapping

Source: user-provided `_     Health History.form`, form ID 24779195, supplied
September 22, 2026. Despite its `.form` extension, this is a JSON configuration.
Only field and workflow configuration was used; embedded scripts were inspected
as reference code, not executed. Notification recipients and unrelated export
metadata are not copied into this repository.

## Conditions

Unless specified otherwise, school means `U_STUDENT_ENROLLMENT_LOGIC.PSEE_SCHOOL_ID`,
the source used by the export's School Workflow Logic element (24779308).

| Section | Condition |
| --- | --- |
| Physician, dentist | Always shown; omit the parent update/correction prompt as requested |
| Daycare provider and phone | School 110 only |
| Dental section immediately above Health Alerts | Current Students.SchoolID 120 or 104 |
| Dental agreement within Dental | Current Students.SchoolID 120 |
| Dental examination within Dental | Current Students.SchoolID 104 |
| Action Plan | Diabetes, seizures, inhaler, or EpiPen = 1, at every school |
| Seizure instructions and return method within Action Plan | Seizures = 1, at every school |
| Inhaler contract | School 311 and inhaler = 1; explicitly approved correction |
| Shared Asthma/Severe Allergy block within Action Plan | Inhaler = 1 or EpiPen = 1; asthma alone does not trigger it |
| Medical-care notice | School 210 or 211, and inhaler = 1 or EpiPen = 1 |
| Allergy Alert field | Always available in Health Alerts |
| Meal Accommodation section, instructions, and return method | Current Students.SchoolID 130 or 131, and allergies = 1 |
| Sports accommodations | Sports = `Yes - With Accommodations` |
| Restricted activities | Sports = `0` or `Yes - With Accommodations` |

The standalone Action Plan section after Medical History shows the student- and school-specific DMMP wording
when Diabetes is Yes, including school 101. The provider's form phrase is underlined
and the first-week-of-school deadline is highlighted. Seizures = 1 shows equivalent
personalized Seizure Action Plan wording in the same section, with the same
underline and highlight. Each plan has its own instructions and return method;
both appear when both conditions are Yes. Its box and banner match Health Contacts
and Health Alerts.

The same Action Plan section also contains one Asthma/Severe Allergy block when
INHALER or EPIPEN is Yes. Both Yes still show only one block and one parent return
method, from ALLERGY_PLAN_COLLECTION_METHOD. Its instructions use the student's
name and school, underlined provider wording, superscript st, and highlighted
deadline. The icon uses the shared Upload-or-existing-document rule for either
Allergy or Asthma category. Documents in both categories appear once. This replaces
the old standalone Asthma/Allergy section; the separate Inhaler Contract retains
its existing school rule.

When Diabetes is Yes, the Action Plan section also shows Parent's Stated
Return Method from `U_STUDENT_ADDITIONAL_INFO.DIABETES_COLLECTION_METHOD`. A
read-only text badge shows the saved value with no submission name; blank values
show Not recorded. This display appears only once, within the section,
including at school 101. It is hidden for seizure-only cases.

When Seizures is Yes, the section also shows Parent's Stated Return Method from
`U_STUDENT_ADDITIONAL_INFO.SEIZURE_PLAN_COLLECTION_METHOD` with the same read-only
text-badge behavior. Its shared document picker and preview use the exact
category name Seizure. The previous standalone Seizure Action Plan section and
school 130/131 restriction are removed. Neither plan overwrites the parent's choice.

For each applicable plan, the document icon appears when its saved return method
is Upload OR the student has an active document in the corresponding category
returned by the native metadata API. This also covers blank, office-return, and
historical method values. Non-Upload choices trigger metadata discovery when the
plan becomes applicable; no content is automatically opened. Discovery errors show
a native Attachments link and an availability-check message rather than implying
there are no files. The document icon opens an inline picker of the selected student's
active, downloadable Diabetes documents. Each entry shows its filename and upload
date; the administrator selects the plan to preview. PDF and PNG/JPEG/GIF/WebP
previews load only after selection. The upload date does not establish the doctor's
plan date, and no document is selected automatically. New parent uploads are
expected to carry category Diabetes; other categories are not included or changed.
Open student attachments remains a separate link to the native page in a new tab
for missing matches, unsupported files, or failed/denied requests. The copied icon
uses this plugin's namespaced image path. Native server authorization still applies;
the integration adds no permission grants or submitted fields.
The same access checks, preview rules, and fallback apply to Seizure documents.
A matching document may show the icon without granting preview permission; only
eligible downloadable documents appear as selectable files in the picker.

Action Plan supersedes the former Diabetes Documentation section. The old school
101 exclusion and school 310 pump/meter-contract substitution are removed; the
Action Plan instructions, parent return method, and document preview apply at
every school when Diabetes is Yes.

## Field mappings and save behavior

Dental is a separate section immediately above Health Alerts, using current
SchoolID. School 120 shows the Dental Agreement heading and DENTAL_AGREE checkbox
with a personalized parent/guardian confirmation of annual dentist care. School
104 shows personalized annual Dental Examination instructions with the SharePoint
report link and highlighted first-week deadline. DENTAL_PLAN_COLLECTION_METHOD
uses the shared read-only tags. Its icon appears for Upload or an active Dental
category match, with the shared authorized preview and native Attachments fallback.
Dental discovery is enabled only at current SchoolID 104.
The agreement saves checked/unchecked as 1/0 when visible. Both the checkbox and
PowerSchool's generated hidden unchecked-value companion are disabled when hidden,
preserving the saved agreement at other schools.

Meal Accommodation is a separate section immediately below Action Plan. Unlike
the enrollment-workflow school conditions above, it uses the student's current
SchoolID, rendered through `data-current-school`. It shows the requested annual
form instructions with the student's name and SharePoint link, plus the saved
FOOD_PLAN_COLLECTION_METHOD tags. Its icon always opens the selected student's
native Attachments page in a new tab while the section is visible. There is no
meal category, metadata lookup, or embedded document preview. Blank methods still
show Not recorded and retain the direct link. School 110 is excluded.

- Physician: `Students.Doctor_Name` and `Students.Doctor_Phone`, both required.
- Dentist: `StudentCoreFields.dentist_name` and `StudentCoreFields.dentist_phone`.
- Daycare: `U_STUDENT_ADDITIONAL_INFO.STUDENT_DAYCARE` and `STUDENT_DAYCARE_PHONE`.
- Medical questions: `WEARS_GLASSES`, `DIABETES`, `SEIZURE_AGREE`, `ASTHMA`,
  `INHALER`, `ALLERGY_AGREE`, and `EPIPEN` in `U_STUDENT_ADDITIONAL_INFO`, values 1/0.
- School 120 checkbox: `U_STUDENT_ADDITIONAL_INFO.DENTAL_AGREE`.
- Sports fields: `CAN_PLAY_SPORTS`, `SPORTS_ACCOMODATIONS`, and
  `UNAPPROVED_ACTIVITES` in the same extension. Existing capitalization variants
  of the accommodations answer remain recognized; the exported option value is
  used for new selections. The sports question uses Yes (`1`), No (`0`), and
  Yes - With Accommodations radio buttons. No shows the restricted-activities
  text box; Yes - With Accommodations shows both dependent text boxes. The question
  and restricted-activities label include the student's first name, with
  `ie. Physical Education` as subtext below the label and above the text box.
- Document methods: `DENTAL_PLAN_COLLECTION_METHOD`, `DIABETES_COLLECTION_METHOD`,
  `SEIZURE_PLAN_COLLECTION_METHOD`, `INHALER_COLLECTION_METHOD`,
  `ALLERGY_PLAN_COLLECTION_METHOD`, and `FOOD_PLAN_COLLECTION_METHOD`.
  These display the parent's stored answer as a read-only text badge (for example,
  Upload or Return to school office), or Not recorded if blank. They have no input
  name, required validation, or upload control and never enter the submitted model.
- Allergies: editable `StudentCoreFields.allergies`, submitted with the main form
  and covered by its actual-change audit stamp. No allergy table, child-record
  API calls, or automatic summary rebuilding. Its single input is now in Health
  Alerts and remains available regardless of the allergies/dietary restrictions answer.
- Extended Care and the state emergency include section are removed from Health
  History. This page no longer displays or submits their fields; stored values
  are unchanged.
- Emergency Authorization and its physician consent, hospital treatment preference,
  and preferred hospital questions are removed. Health History no longer submits
  `PHYSICIAN_CONSENT`, `HOSPITAL_CONSENT`, or `STUDENT_HOSPITAL`.
- Health Alerts appears immediately before Sports Participation. It copies Allergy
  Alert, Medical Alert, Medical Action Plan Alert, and Concussion Alert from Custom
  Alerts' `alerts.html`, retaining the native tables, headings, and icon paths.
  Medical Alert Text and Expiration Date are now in this section. The fields use
  `Students.alert_Medical`, `Students.Alert_MedicalExpires`, and extension fields
  `IHP_ALERT`, `IHP_DESCRIPTION`, `CONCUSSION_ALERT`, and `CONCUSSION_DESC`.
  The two checkboxes bind checked/unchecked to `1`/`0`. All fields participate in
  Angular initialization, change tracking, and the main native submit/audit path.
  Icons remain supplied by PowerSchool and the installed Custom Alerts plugin.
- Medication Authorization and its `STUDENT_MEDICATION` question are removed
  from Health History; this page no longer submits that field.

Hidden dependent fields remain initialized in Angular. They are disabled for
native submission and excluded from change comparison until visible. Values are
not automatically erased when a parent answer changes. Parent document choices
are always display-only, as requested.

## Export defects handled explicitly

- The exported inhaler container compares the diabetes/seizure sum to `311`.
  The user approved replacing it with school 311 and inhaler = Yes.
- An unused PKEM Inhaler Logic element references IDs not present in the export.
  It is not copied into the admin page.
- The export's hidden allergy-summary dependency and collection script are not
  copied: the user requested only the native allergy field, not a child table.
- The old daycare phone display repeats the daycare-name field. The editable
  mapping correctly identifies `STUDENT_DAYCARE_PHONE`; that mapping is used here.

No table schemas were changed or moved. Local tests do not replace installed
PowerSchool checks for field rendering, API permissions, query execution, or writes.
