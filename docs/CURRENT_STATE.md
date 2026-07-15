# Current State

## Confirmed completed work

- A PowerSchool extension XML exists.
- The XML defines:
  - `u_student_medication`, a student child table for medication definitions.
  - `u_student_medication_inventory`, a standalone table for inventory lots.
- The schema includes medication name, dose, dose unit, inventory unit, frequency, route, audit user/date, notes, and immutable quantities received. Remaining quantities are derived rather than stored.
- The data model direction of one medication to many inventory lots has been established.
- The repository schema defines the append-only `u_student_med_inv_txn` inventory transaction table.
- Existing inventory lots are read-only in the drawer; refills create new lots.
- Parent pickup and other approved removals create one medication-level transaction and display in the Deductions table at the bottom of Edit Inventory.
- Lot balances and total available inventory are derived by applying the net transaction quantity to immutable received lots in FIFO order.
- The medication definition includes an automatically maintained replenishment baseline. Nurses do not configure per-dose inventory quantities or alert percentages.
- The inventory page calculates Normal, Low, Critical, and Out states from fixed 20% and 10% thresholds. Normal has no visible indicator and percentages are not displayed. The full warning label is left-aligned and the quantity is right-aligned on the single inventory row or on the Total row when multiple lots exist; Out of Inventory uses a subtle pale-red treatment. Adding inventory resets the baseline; deductions do not.
- The main page labels creation as `Add Medication`; the edit drawer uses `Add Inventory` for additional count-in rows on an existing medication.
- Add/Edit Medication prevents duplicate definitions for the same student when normalized medication name, numeric dosage amount, and dose unit match, while allowing the same name with a different dosage or dose unit.
- Medication-name spacing is normalized on blur and before save by trimming the ends, collapsing repeated internal spaces, and capitalizing the first character while preserving the remainder of the entered capitalization.
- Inventory quantities use spaced remaining/original formatting such as `2.75 / 5 Pills` for readability.
- Add/edit and removal use one PowerSchool drawer with internal modes so medication context is preserved.
- Reversal is not exposed in the nurse-facing inventory workflow. A future correction workflow must be designed separately from medication physically returning to school.
- The full inventory workflow has been validated successfully on the PowerSchool test server, including medication creation, required inventory, multiple inventory rows, read-only lots, additions, FIFO deductions, insufficient-inventory blocking, decimal quantities, warning thresholds, duplicate prevention, and medication-name normalization.
- The initial student-specific Medication Administration page is implemented as one Administer Medication button followed directly by a simple administration-history table. Inventory is not displayed on the page. The drawer limits medication selection to medications with inventory available, records administered date/time, quantity, staff member, and notes, and confirms the medication and dose before saving.
- The Administer Medication button remains visible even when no medication is available. In that case, the drawer explains that medication must first be added through the Medication Inventory page. The administration drawer uses compact spacing consistent with the other medication drawers.
- When history contains more than one medication definition, the administration table provides a medication filter that distinguishes medication name and prescribed dosage.
- Each given administration is stored as one `ADMINISTRATION` row in the existing inventory transaction ledger. The row contains medication-detail snapshots and its negative quantity is consumed by the same FIFO calculation used for other deductions.
- Health-log and active-staff reads are served by SQL-backed JSON pages in this plugin.
- The application no longer calls the `net.cdolinc.health.healthLog.logs` or `net.cdolinc.health.healthLog.staff` PowerQueries at runtime.
- The internal schema API permission mappings formerly supplied by `cdol_health_log_pqs` are maintained in this repository. Medication custom-page writes do not require external API field access requests.
- The default VS Code build creates two installable plugins from the one repository and source `plugin.xml`: the main plugin without `permissions_root`, and a `CDOL Health Log - Data Access` plugin containing the permission mappings without `user_schema_root` or application files.

## Prior implementation status reported in ChatGPT

The most recent recovered implementation summary stated:

- The medication definition table exists.
- The inventory-lot table exists.
- An inner inventory-lot UI and save workflow was still missing.
- The medication drawer did not yet include the `inventory_unit` input.
- Creating a medication did not yet POST or create the first inventory lot.
- The next implementation step was to add inventory-lot UI/save logic and create the first lot when a medication is created.

## Not confirmed as completed

The available project files do not prove completion of:

- Live PowerSchool installation and validation of the initial Medication Administration page and `ADMINISTRATION` transaction fields
- Missed-dose workflow
- Required missed-dose reasons
- Gap detection
- Reminder scheduling
- Controlled-medication reconciliation
- Authorization enforcement
- Server-side concurrency protection against simultaneous inventory removals
- Automated tests
- Packaging and installation validation of the new Medication Administration version

## Source files

The medication inventory, health-log pages, JavaScript services, SQL-backed JSON pages, schema, and permission mappings are present in this repository.
