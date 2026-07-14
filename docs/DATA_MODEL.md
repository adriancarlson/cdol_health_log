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
| `quantity_remaining` | Double | Current quantity remaining in the lot |
| `added_date` | Date | Date received or added |
| `users_dcid` | Integer | User who added or counted the lot |
| `notes` | String(4000) | Lot or count-in notes |

The inventory unit is stored on the medication definition and is shared by its lots. After the transaction ledger is installed, `quantity_remaining` is the opening balance for existing rows and the initial balance for new rows. It is not directly edited by the application; current remaining quantity is calculated by adding ledger changes.

### `u_student_med_inv_txn`

Append-only standalone inventory transaction/allocation table.

| Field | Type | Purpose |
|---|---|---|
| `u_student_medication_id` | Integer | Medication affected by the event |
| `inventory_id` | Integer | Inventory lot receiving this FIFO allocation |
| `event_key` | String(36) | Groups allocations when one event spans multiple lots |
| `transaction_type` | String(50) | Controlled removal or reversal type |
| `quantity_change` | Double | Signed change applied to the lot |
| `transaction_date` | Date | Date the event occurred |
| `transaction_time` | Integer | PowerSchool-style seconds since midnight |
| `users_dcid` | Integer | Staff member who processed the event |
| `notes` | String(4000) | Required audit explanation |
| `reversal_of_event_key` | String(36) | Event reversed by this compensating entry |

## Required relationship behavior

- One student can have many medication definitions.
- One medication definition can have many inventory lots.
- A refill adds an inventory lot.
- Inventory consumption uses the oldest lot with remaining quantity first.
- Quantity history must not be overwritten.
- Inventory removals create one or more FIFO transaction rows rather than updating the original lot.
- Reversals create compensating transaction rows; original events remain present.

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

Medication administration will later create allocations in `u_student_med_inv_txn`; the administration-link field and administration schema must be approved together.
