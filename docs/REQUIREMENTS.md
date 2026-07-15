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

## 3. Route

Route must use a controlled dropdown rather than unrestricted free text.

Routes discussed during planning included:

- Oral
- Nasal
- Sublingual
- Buccal
- Subcutaneous
- Rectal

The final production route list must be confirmed. If an `Other` choice is retained, the additional explanation should be captured in notes rather than replacing the controlled route value with arbitrary text.

## 4. Inventory

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
- Show total quantity remaining across all open lots.
- Reset the inventory-alert baseline to the total available quantity immediately after inventory is added.
- Calculate the percentage of inventory remaining by comparing the current total with the replenishment baseline.
- Display four inventory levels: Normal above 20%, Low Inventory above 10% through 20%, Critical Inventory above 0% through 10%, and Out of Inventory at 0%.
- Use fixed system thresholds of 20% for Low Inventory and 10% for Critical Inventory; nurses do not configure these percentages.
- Do not display a percentage or a Normal label to the nurse. For one inventory lot, apply the warning color and left-aligned `Low Inventory`, `Critical Inventory`, or `Out of Inventory` label to that lot row. For multiple lots, apply the warning only to the Total row. Keep the quantity right-aligned, and use a subtle pale-red treatment for Out of Inventory.
- Support controlled-medication inventory and count auditing.

## 5. Medication administration

The administration interface must be table-based, not calendar-based.

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

Expected statuses include at least:

- Given
- Missed
- Refused
- Absent
- Sick or ill
- Other

When a scheduled dose is not given:

- A reason is required.
- `Other` requires an explanatory note.
- The system should highlight gaps or missed expected administrations.

For administration:

- Inventory should be reduced automatically using FIFO.
- Each administration creates one auditable inventory transaction; FIFO lot balances are derived when inventory is displayed.
- The nurse enters the quantity administered in the medication's inventory unit. The form displays the prescribed dosage in parentheses as reference, such as `1 Pill (10 mg)`.
- The entered inventory quantity, including decimals such as `0.5 Pill`, becomes the actual inventory deduction; the medication definition does not store a fixed inventory quantity per dose.
- The system should include a spelling and dose double-check step or confirmation prompt before committing sensitive medication details.
- PRN administrations must be supported without creating false missed-dose alerts.

## 6. Alerts and reminders

The project should support:

- Low-inventory indicators
- Alerts when expected daily administrations are missing
- A configurable daily reminder time
- Clear identification of records needing action

The storage level for reminder settings, such as per user, school, or medication, remains an open design decision.

## 7. Auditability

The system must retain who, what, and when information for:

- Medication creation and edits
- Inventory added
- Inventory removed
- Parent pickup deductions
- Medication administered
- Missed or refused doses
- Corrections or reversals

Historical transactions must not be silently overwritten.

## 8. Authorization

Only authorized staff should be able to view or modify medication inventory and administration data.

Codex must inspect existing PowerSchool group, page-permission, plugin-security, and API options before proposing the final authorization implementation.
