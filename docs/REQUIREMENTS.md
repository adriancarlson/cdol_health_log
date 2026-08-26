# Requirements

## 1. Medication definition

Each student medication should have one medication definition record.

Required or expected medication properties:

- Medication name, free-form text
- Administered dose amount, supporting whole numbers and decimals
- Dose unit
- Inventory unit
- Frequency
- Route
- Date added
- User who added or maintained the record
- Notes

Supported dosage units should include common values such as:

- mg
- mL
- tablet or pill
- units, when medically appropriate

Do not use `cc`.

Medication names remain free-form because the list of medications cannot be reliably constrained.

Normalize medication-name spacing before saving by trimming leading and trailing whitespace and replacing repeated internal whitespace with one space. Capitalize the first character, but preserve the remainder of the capitalization entered by the nurse; do not automatically apply full title case because medication names may contain intentional capitalization, abbreviations, numbers, or suffixes.

Do not allow two medication definitions for the same student when the medication name, numeric dosage amount, and dose unit match. Compare names and units without case or extra-space differences, and compare dosage amounts numerically so values such as `10` and `10.0` match. When a duplicate is entered, disable Save and direct the nurse to use Add Inventory on the existing medication. The same medication name remains allowed when either the dosage amount or dose unit differs.

## 2. Frequency

Frequency must support at least:

- Daily
- As needed / PRN
- A controlled way to store another schedule or instruction

Frequency and scheduling details belong with the medication or administration schedule, not with each inventory lot.

Dose unit, inventory unit, route, and frequency options must come from the shared `u_cdol_health_option` extended table using these option categories:

- `MED_DOSE_UNIT`
- `MED_INVENTORY_UNIT`
- `MED_ROUTE`
- `MED_FREQUENCY`
- `MED_REMOVAL_TYPE`
- `MED_NOT_GIVEN_REASON`

The table is shared with the Health Log complaint, destination, and conversation-type lists. Sport continues to use PowerSchool's native `Sports` Code Set. Removal rows store the stable code selected from `MED_REMOVAL_TYPE`; system-owned administration and correction transaction types remain application-controlled.

Do not automatically seed initial values. District administrators populate and maintain each category from `/admin/district/healthsetup/cdolhealthoptions.html`. The page must appear only in District Office navigation under **District Management → Health**, immediately after the native Health Code Sets link. It must allow an administrator to select a CDOL Health Code Set, add codes, edit the display value, mark a value Active or Inactive, change display order with Move up and Move down controls, and sort the selected code set alphabetically. Alphabetical sorting is available for every custom health code set and sorts Active and Inactive values separately so values never cross the status boundary. Display order is assigned automatically and is not typed in the Add/Edit drawer. Inactive values must remain stored so historical references are not deleted. The main grid hides Inactive values by default. When the selected set contains inactive values, a Show Inactive checkbox with the inactive count appears immediately before Add Code. When selected, Inactive values appear after all Active values and can only be reordered within the Inactive group. The grid displays Created By immediately after Display Value. It displays Count immediately after Status with the number of medication definition, medication transaction, or Health Log records that reference each option. Stable codes and legacy case-insensitive display-value matches both count as usage; a Health Log record with multiple Communication Methods counts once for each option it contains. The Edit drawer displays PowerSchool's Created By, Created On, Modified By, and Modified On audit values as read-only information. Every add-option workflow—the district Add Health Code drawer, Health Log inline add controls, and Medication inline `Other` controls—warns when the proposed value's normalized meaningful words match an existing value in that same code set after ignoring capitalization, punctuation, common filler words such as `to` and `the`, and common destination-action words such as `back`, `return`, `go`, and `sent`. The warning identifies the existing value and encourages reuse but does not block an intentionally separate value; exact duplicate code or display values remain blocked or select the existing option according to the workflow.

Each medication dropdown, including Removal Type, includes an italicized `Other` action for authorized Medication Inventory users. Selecting it temporarily replaces that dropdown with a text field, plus button, and Cancel button. A successful plus action creates the value in the associated option category, restores the dropdown, adds the new value, and selects it for the current medication or removal. Cancel restores the unselected dropdown without creating a value. `Other` itself is a UI action and must never be saved as the field value.

For a newly added option:

- Trim leading and trailing whitespace.
- Replace repeated internal whitespace with one space.
- Capitalize the first character while preserving the remainder of the user's capitalization.
- Store that normalized text identically in `displayValue` and `description`.
- Generate `code` by lowercasing the normalized text and removing all whitespace.
- Limit `displayValue` and `description` to 100 characters because `displayValue` is the tighter database field.
- Reject a generated `code` longer than 40 characters rather than silently truncating it.
- If the normalized display value or generated code already exists in that category, select the existing value instead of creating a duplicate.

## 3. Route

Route must use a controlled dropdown rather than unrestricted free text.

Routes discussed during planning included:

- Oral
- Nasal
- Sublingual
- Buccal
- Subcutaneous
- Rectal

The initial production values must be entered and confirmed through the district CDOL Health Code Sets page. Later additions must use the controlled shared-option workflow above rather than unrestricted route text.

## 4. Health Log controlled options

New Health Log records must use controlled options for Complaint, Destination, and Conversation Type from these `u_cdol_health_option` categories:

- `HEALTH_COMPLAINT`
- `HEALTH_DESTINATION`
- `HEALTH_CONVERSATION`

New records store the selected Complaint and Destination option `code`; tables and drawers resolve those codes to their current display labels. Communication Methods allow one or more Active `HEALTH_CONVERSATION` options and store their codes as one comma-separated string in `conversation_type`, such as `email,phone`. History displays the corresponding labels separated by a comma and space, such as `Email, Phone`. Sport must remain connected to PowerSchool's native `Sports` Code Set, and Treatment remains free text. `HEALTH_SPORT` must not appear in the custom CDOL Health Code Sets manager.

Complaint and Destination include the same italicized `Other` add-new action used by Medication Inventory. Communication Methods use visible checkboxes rather than a browser multi-select and provide a `+ Add communication method` action below the choices. At least one method is required. A successfully added method becomes checked immediately. Save must remain disabled while an add-new control is open, while its POST is in progress, and after a failed POST until the nurse either succeeds or cancels. New records must never save arbitrary unmatched text; visit-specific details belong in Notes.

Existing Health Log records must preserve their stored values without migration or silent conversion:

- Match stored values against all custom options by code and by case-insensitive display value. For Communication Methods, first attempt an exact single-option match; otherwise treat commas as separators only when every segment resolves to a known option.
- If the value matches Active options, show the dropdown or communication-method checkboxes selected. Saving an unrelated change preserves the original stored value unless the nurse deliberately changes a selection.
- If the value matches an Inactive option, hide the dropdown and display the option label as read-only text.
- If the value matches no option, hide the dropdown and display the complete original value as read-only text.
- A read-only historical value cannot be replaced or added to the option table from that historical record.
- Tables and filters resolve known codes to display labels and otherwise fall back to the original stored value.

The Health Log page receives GET and POST access to `u_cdol_health_option`; option editing, activation, inactivation, and reordering remain district-admin functions. PowerSchool permission mappings authorize access to the shared table route and cannot restrict POST access to individual `codetype` categories.

The approved Medication and Health Log import defaults are maintained in `docs/u_cdol_health_option_defaults.csv`. The existing Medication Removal Type values are maintained separately in `docs/u_cdol_health_option_removal_type_defaults.csv` so they can be imported when the configurable dropdown is introduced. The UI's italicized `Other` action is not a stored option; the removal template retains the existing `OTHER_REMOVAL` audit code and its `Other Removal` label for backward compatibility.

## 5. Inventory

Inventory must support multiple count-in or refill lots for one medication.

Each inventory lot must track:

- Medication link
- Quantity added
- Inventory unit
- Date received or added
- Person who counted or added it
- Notes

Rules:

- Do not create a second medication definition when a refill arrives.
- Do not overwrite the original inventory quantity or history.
- Create a new inventory lot for each refill or count-in event.
- Preserve prior lots, including their original quantity, date, user, and notes.
- Derive each lot's remaining quantity from immutable received lots and the transaction history.
- Deduct administered medication using FIFO, beginning with the oldest lot that still has quantity remaining.
- Support inventory deductions when medication is picked up by a parent or otherwise removed.
- Treat `Added in Error` and `Wrong Number Entered` removals as corrections to medication received. Apply the corrected quantity FIFO to derive an effective received quantity without changing or deleting the original lot or audit transaction.
- Use the effective received quantity as the displayed denominator. Hide a lot from the main Inventory quantity display only when an entry correction reduces its effective received quantity to zero; retain the medication definition, original lot, and Inventory Activity history.
- Do not allow the low-inventory calculation's replenishment baseline to exceed the effective received quantity after an inventory-entry correction.
- Continue displaying ordinarily depleted lots when they reach zero through administrations, parent pickup, disposal, lost/damaged medication, or another non-correction removal.
- Show total quantity remaining across all open lots.
- Display remaining/original quantities with spaces around the slash, such as `2.75 / 5 Pills`.
- Reset the inventory-alert baseline to the total available quantity immediately after inventory is added.
- Calculate the percentage of inventory remaining by comparing the current total with the replenishment baseline.
- Display four inventory levels: Normal above 20%, Low Inventory above 10% through 20%, Critical Inventory above 0% through 10%, and Out of Inventory at 0%.
- Use fixed system thresholds of 20% for Low Inventory and 10% for Critical Inventory; nurses do not configure these percentages.
- Do not display a percentage or a Normal label to the nurse. For one inventory lot, apply the warning color and left-aligned `Low Inventory`, `Critical Inventory`, or `Out of Inventory` label to that lot row. For multiple lots, apply the warning only to the Total row. Keep the quantity right-aligned, and use a subtle pale-red treatment for Out of Inventory.
- Support controlled-medication inventory and count auditing.

## 6. Medication administration

The administration interface must be table-based, not calendar-based.

The student Administration page should remain simple: one Administer Medication button followed by the administration-history table, without an additional section heading or an inventory table. The medication selector in the drawer must include only medications with available inventory. Administration history may contain multiple medications and should be filterable by medication when needed.

Each administration event should capture:

- Student
- Medication
- Scheduled or expected date and time, when applicable
- Actual administration date and time
- Dose administered
- Dose unit
- Route
- Person who administered it
- Status
- Notes
- Inventory deduction

Administration history includes these effective statuses:

- Given
- Not Given
- Action Required for an unresolved expected daily administration
- Corrected
- Entered in Error

For a medication whose controlled Frequency code is `daily`, the system must derive one expected administration for
each weekday marked in session in the medication school's PowerSchool calendar. An expected day begins strictly after
the medication's first inventory-added date and must also fall within the student's enrollment at that school and the
medication's school year. Saturdays, Sundays, and calendar days not marked in session are excluded. PRN and all other
frequencies do not create expected rows.

Each school must configure a daily medication cutoff time. The current day becomes Action Required only after that
cutoff; earlier qualifying days become Action Required immediately. A missing school cutoff must produce a visible
configuration warning and must not create speculative Action Required rows.

An unresolved expected row is calculated at page load and is not stored. It is displayed in red as a missed daily
administration requiring action. The nurse resolves it by either recording the medication as Given for that expected
school day or recording a Not Given reason.

When a scheduled dose is not given:

- A reason from `MED_NOT_GIVEN_REASON` is required.
- The initial import values are `Ill`, `Refused`, and `Absent`.
- `Other` is the shared italicized add-new action. It creates and selects a reusable reason; `Other` is never stored as
  the transaction reason.
- The transaction stores both the stable reason code and a label snapshot so future reports can group by stable code
  while retaining the wording shown when the event was documented.
- Notes remain available for event-specific details.
- A later reason correction creates an append-only correction row rather than updating the original.
- If the medication was actually given, converting a Not Given entry to Given creates a linked administration row,
  deducts inventory, preserves the original Not Given audit record, and removes that Not Given from effective reports.

For administration:

- Inventory should be reduced automatically using FIFO.
- Each administration creates one auditable inventory transaction; FIFO lot balances are derived when inventory is displayed.
- The nurse enters the quantity administered in the medication's inventory unit. The form displays the prescribed dosage in parentheses as reference, such as `1 Pill (10 mg)`.
- The entered inventory quantity, including decimals such as `0.5 Pill`, becomes the actual inventory deduction; the medication definition does not store a fixed inventory quantity per dose.
- The system should include a spelling and dose double-check step or confirmation prompt before committing sensitive medication details.
- PRN administrations must be supported without creating false missed-dose alerts.
- Backdated administrations created from an Action Required row use that expected school date and capture the actual
  administration time and staff member.

## 7. Alerts and reminders

The project should support:

- Low-inventory indicators
- Alerts when expected daily administrations are missing
- A configurable daily cutoff time per school
- Clear identification of records needing action

## 8. Auditability

The system must retain who, what, and when information for:

- Medication creation and edits
- Inventory added
- Inventory removed
- Parent pickup deductions
- Medication administered
- Missed or refused doses
- Corrections or reversals

Historical transactions must not be silently overwritten.

## 9. Authorization

Only authorized staff should be able to view or modify medication inventory and administration data.

Codex must inspect existing PowerSchool group, page-permission, plugin-security, and API options before proposing the final authorization implementation.
