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
| Physician, dentist, daycare | Always shown; omit the parent update/correction prompt as requested |
| Dental agreement | School 120 |
| Dental examination | School 104 |
| Diabetes documentation | Diabetes = 1 and school does not match `101` (export's negative-match rule) |
| General action-plan notice | Diabetes = 1 or seizures = 1 |
| Seizure plan | School 130 or 131, and seizures = 1 |
| Inhaler contract | School 311 and inhaler = 1; explicitly approved correction |
| Asthma/allergy plan | Inhaler = 1 or EpiPen = 1; asthma alone does not trigger it |
| Medical-care notice | School 210 or 211, and inhaler = 1 or EpiPen = 1 |
| Allergy Alert field | Always available in Health Alerts |
| Meal-document return method | School 110, 130, or 131, and allergies = 1 |
| Meal-accommodation instructions | School 130 or 131, and allergies = 1 |
| Sports accommodations | Sports = `Yes - With Accommodations` |
| Restricted activities | Sports = `0` or `Yes - With Accommodations` |

Diabetes documentation uses the diabetic pump/meter contract when the student's
current `SchoolID` is 310, matching the export's document-link substitution.
Other schools use the Diabetes Action Plan. This is distinct from the enrollment
school used for section visibility.

## Field mappings and save behavior

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
  and restricted-activities label include the student's first name, with Physical
  Education shown as an example below the restricted-activities box.
- Document methods: `DENTAL_PLAN_COLLECTION_METHOD`, `DIABETES_COLLECTION_METHOD`,
  `SEIZURE_PLAN_COLLECTION_METHOD`, `INHALER_COLLECTION_METHOD`,
  `ALLERGY_PLAN_COLLECTION_METHOD`, and `FOOD_PLAN_COLLECTION_METHOD`.
  These display the parent's stored answer as disabled radio buttons (Upload or
  Return to school office) beneath the school-specific form link, without an input name, required
  validation, upload control, or upload link. They never enter the submitted model.
- Allergies: editable `StudentCoreFields.allergies`, submitted with the main form
  and covered by its actual-change audit stamp. No allergy table, child-record
  API calls, or automatic summary rebuilding. Its single input is now in Health
  Alerts and remains available regardless of the allergies/dietary restrictions answer.
- Existing extended-care and state fields remain available from the previous admin page.
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
