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
- Provide a low-inventory warning or visual indicator.
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
