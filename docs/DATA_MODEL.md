# Data Model

## Confirmed installed schema

The recovered XML defines two tables.

### `u_student_medication`

PowerSchool child extension of `students`.

| Field | Type | Purpose |
|---|---|---|
| `medication_name` | String(250) | Free-form medication name |
| `dose_amount` | Double | Administered dose amount |
| `dose_unit` | String(250) | Dose unit |
| `inventory_unit` | String(250) | Unit used to count inventory |
| `frequency` | String(250) | Daily, PRN, or other instruction |
| `route` | String(250) | Controlled route value |
| `date_added` | Date | Date medication definition was added |
| `users_dcid` | Integer | User associated with creation or maintenance |
| `notes` | String(4000) | Medication notes |

PowerSchool supplies the child-table relationship to the student. Prior discussion indicated `studentdcid` is handled automatically for this child table.

### `u_student_medication_inventory`

PowerSchool standalone table.

| Field | Type | Purpose |
|---|---|---|
| `u_student_medication_id` | Integer | Link to medication definition |
| `quantity_added` | Double | Original quantity received |
| `quantity_remaining` | Double | Current quantity remaining in the lot |
| `unit` | String(50) | Inventory unit |
| `date_added` | Date | Date received or added |
| `users_dcid` | Integer | User who added or counted the lot |
| `notes` | String(4000) | Lot or count-in notes |

## Required relationship behavior

- One student can have many medication definitions.
- One medication definition can have many inventory lots.
- A refill adds an inventory lot.
- Inventory consumption uses the oldest lot with remaining quantity first.
- Quantity history must not be overwritten.

## Missing schema

The recovered schema does not define a medication administration table or a detailed inventory transaction/allocation table.

A production design will likely need one or both of the following concepts:

### Administration record

Possible fields to evaluate:

- Student reference
- Medication reference
- Expected date/time
- Administered date/time
- Status
- Dose amount
- Dose unit
- Route
- Administered-by user
- Required missed-dose reason
- Notes
- Created/updated audit metadata
- Correction, reversal, or void metadata

### Inventory transaction or lot allocation

Possible fields to evaluate:

- Medication reference
- Inventory lot reference
- Administration reference, when applicable
- Transaction type, such as count-in, administration, parent pickup, correction, or disposal
- Quantity change
- Quantity before and after
- User
- Date/time
- Notes
- Reversal linkage

Codex must inspect the existing implementation and PowerSchool constraints before selecting the final schema. Do not treat the possible fields above as approved database changes.
