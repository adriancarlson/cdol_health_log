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
| `event_time` | Integer | Administration time in PowerSchool seconds-from-midnight format; blank for removal-only events |
| `users_dcid` | Integer | Staff member who processed the event |
| `notes` | String(4000) | Required audit explanation |
| `medication_name` | String(250) | Medication-name snapshot for an administration |
| `dose_amount` | Double | Prescribed-dose snapshot for an administration |
| `dose_unit` | String(250) | Prescribed-dose-unit snapshot for an administration |
| `inventory_unit` | String(250) | Inventory-unit snapshot for an administration |
| `route` | String(250) | Route snapshot for an administration |
| `frequency` | String(250) | Frequency snapshot for an administration |
| `reversal_of_transaction_id` | Integer | Reserved for historical data and a future correction workflow; not used by the nurse-facing removal form |

Removal rows use the common transaction fields. A given dose uses `transaction_type = ADMINISTRATION`, stores the administration details in the snapshot fields, and records the administered inventory quantity as a negative `quantity_change`. One row therefore serves as both the administration audit record and the inventory deduction, avoiding a partial two-record save.

## Required relationship behavior

- One student can have many medication definitions.
- One medication definition can have many inventory lots.
- A refill adds an inventory lot.
- Inventory consumption is applied to lots oldest-first when remaining quantities are derived.
- Quantity history must not be overwritten.
- Each inventory removal creates one transaction row rather than updating an original lot.
- Saved removal transactions remain append-only. The nurse-facing workflow does not currently provide correction or reversal controls.

## Initial administration model

The initial implementation records only doses that were actually administered. The administration page filters the shared ledger to `ADMINISTRATION` rows and shows those rows as administration history. Student and school-year context are derived through the linked medication definition.

The administration form collects the actual quantity used in the medication's inventory unit and shows the prescribed dose amount and unit in parentheses for reference. That entered quantity becomes the transaction's negative `quantity_change`.

Expected schedules, missed-dose statuses and reasons, and correction metadata remain later phases and may require additional schema after those workflows are approved.
