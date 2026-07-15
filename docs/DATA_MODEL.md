# Data Model

## Repository schema

The repository XML defines three medication-related tables. Installation in PowerSchool must be validated after packaging.

### `u_student_medication`

PowerSchool child extension of `students`.

| Field | Type | Purpose |
|---|---|---|
| `medication_name` | String(250) | Free-form medication name |
| `dose_amount` | Double | Administered dose amount |
| `dose_unit` | String(250) | Dose unit |
| `inventory_unit` | String(250) | Unit used to count inventory |
| `inventory_baseline_quantity` | Double | Total available quantity immediately after inventory was most recently added |
| `frequency` | String(250) | Daily, PRN, or other instruction |
| `route` | String(250) | Controlled route value |
| `created_date` | Date | Date medication definition was added |
| `users_dcid` | Integer | User associated with creation or maintenance |
| `notes` | String(4000) | Medication notes |
| `schoolid` | Integer | School context captured when the definition was created |
| `yearid` | Integer | School-year context captured when the definition was created |

PowerSchool supplies the child-table relationship to the student. Prior discussion indicated `studentdcid` is handled automatically for this child table.

### `u_student_medication_inventory`

PowerSchool standalone table.

| Field | Type | Purpose |
|---|---|---|
| `u_student_medication_id` | Integer | Link to medication definition |
| `quantity_added` | Double | Original quantity received |
| `added_date` | Date | Date received or added |
| `users_dcid` | Integer | User who added or counted the lot |
| `notes` | String(4000) | Lot or count-in notes |

The inventory unit is stored on the medication definition and is shared by its lots. Lots are immutable records of medication received. The application derives each lot's remaining quantity by applying the medication's net transaction quantity to its lots in FIFO order.

The inventory-alert baseline is reset automatically to the total available inventory after one or more new inventory rows are saved. It is not reset by a deduction and is not entered by the nurse. The percentage remaining is calculated rather than stored. It compares current inventory quantity against the replenishment baseline. Normal is above 20%, Low is above 10% through 20%, Critical is above zero through 10%, and Out is zero.

### `u_student_med_inv_txn`

Append-only standalone inventory transaction table. Each real-world removal creates exactly one row.

| Field | Type | Purpose |
|---|---|---|
| `u_student_medication_id` | Integer | Medication affected by the event |
| `transaction_type` | String(50) | Controlled removal type |
| `quantity_change` | Double | Signed change applied to the medication's total inventory |
| `event_date` | Date | Date the event occurred |
| `users_dcid` | Integer | Staff member who processed the event |
| `notes` | String(4000) | Required audit explanation |
| `reversal_of_transaction_id` | Integer | Reserved for historical data and a future correction workflow; not used by the nurse-facing removal form |

## Required relationship behavior

- One student can have many medication definitions.
- One medication definition can have many inventory lots.
- A refill adds an inventory lot.
- Inventory consumption is applied to lots oldest-first when remaining quantities are derived.
- Quantity history must not be overwritten.
- Each inventory removal creates one transaction row rather than updating an original lot.
- Saved removal transactions remain append-only. The nurse-facing workflow does not currently provide correction or reversal controls.

## Missing schema

The repository schema does not yet define a medication administration table.

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

Medication administration will later create one row in `u_student_med_inv_txn`; the administration-link field and administration schema must be approved together.

The administration form will collect the actual quantity used in the medication's inventory unit and show the prescribed dose amount and unit in parentheses for reference. That entered quantity becomes the transaction's negative `quantity_change`.
