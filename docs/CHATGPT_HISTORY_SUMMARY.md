# ChatGPT History Summary

## March 26, 2026

Planning began for a school nurse medication administration page, starting with inventory.

Initial discussion covered:

- Medication name
- Dose
- Units
- Frequency
- Timing
- Route
- Inventory quantity
- Dummy medication data for UI planning

A key clarification was that a value such as `Vyvanse 10 mg` describes the administered dose, not the number of doses or tablets received.

The inventory design was then simplified:

- Remove timing from inventory.
- Remove `active_flag` from inventory.
- Keep dose information on the medication definition.
- Use a separate inventory-lot concept for quantities received.
- Keep one medication definition per student medication.
- Add refill/count-in rows without overwriting older rows.
- Deduct FIFO from the oldest lot with remaining quantity.

A PowerSchool XML schema was created with two tables:

- `u_student_medication`
- `u_student_medication_inventory`

## April 20, 2026

The project was reviewed in the context of PowerSchool health and medical data workflows.

The recovered current-state assessment was:

- Medication definition table exists.
- Inventory table exists.
- Inventory needed an inner lot layer in the UI and save logic.
- The medication form/drawer was missing `inventory_unit`.
- New-medication creation still needed to create the first inventory lot.

Additional workflow requirements included:

- Daily prescription administration, including controlled medications
- Who administered the dose
- Dose and route
- Inventory auditing
- Table-based administration rather than a calendar
- Required reasons for missed doses
- Low-inventory warning
- Notes for inventory and administration

## June 10, 2026

The requirements were expanded and consolidated:

- Daily administration table
- Reasons for missed doses, including absent, refused, sick, and other
- Alerts for gaps and low inventory
- Free-form medication name and notes
- Controlled medication support
- Count-in tracking with who and date
- Dosage units such as mg, mL, and pill/tablet
- Controlled route list
- Frequency support for daily, PRN, and other instructions
- Customizable daily alert time
- Given-by tracking connected to the health workflow
- Inventory totals
- Parent pickup deductions
- Spelling and dose double-check prompt
- Access limited to authorized staff

## Reliability note

This is a structured summary of project context recoverable from ChatGPT, not a word-for-word transcript. Preserve any original chat export separately if a verbatim archive is required.
