# Current State

## Confirmed completed work

- A PowerSchool extension XML exists.
- The XML defines:
  - `u_student_medication`, a student child table for medication definitions.
  - `u_student_medication_inventory`, a standalone table for inventory lots.
  - `u_student_med_inv_txn`, a standalone append-only inventory and administration activity table.
  - `u_cdol_health_option`, a shared standalone table for categorized Health workflow options.
- The schema includes medication name, dose, dose unit, inventory unit, frequency, route, audit user/date, notes, and immutable quantities received. Remaining quantities are derived rather than stored.
- The data model direction of one medication to many inventory lots has been established.
- The repository schema defines the append-only `u_student_med_inv_txn` inventory transaction table.
- Existing inventory lots are read-only in the drawer; refills create new lots.
- Parent pickup and other approved removals create one medication-level transaction and display in the Inventory Activity table at the bottom of Edit Inventory.
- Lot balances and total available inventory are derived by applying the net transaction quantity to immutable received lots in FIFO order.
- The medication definition includes an automatically maintained replenishment baseline. Nurses do not configure per-dose inventory quantities or alert percentages.
- The inventory page calculates Normal, Low, Critical, and Out states from fixed 20% and 10% thresholds. Normal has no visible indicator and percentages are not displayed. The full warning label is left-aligned and the quantity is right-aligned on the single inventory row or on the Total row when multiple lots exist; Out of Inventory uses a subtle pale-red treatment. Adding inventory resets the baseline; deductions do not.
- The main page labels creation as `Add Medication`; the edit drawer uses `Add Inventory` for additional count-in rows on an existing medication.
- Add/Edit Medication prevents duplicate definitions for the same student when normalized medication name, numeric dosage amount, and dose unit match, while allowing the same name with a different dosage or dose unit.
- Medication-name spacing is normalized on blur and before save by trimming the ends, collapsing repeated internal spaces, and capitalizing the first character while preserving the remainder of the entered capitalization.
- Medication dose unit, inventory unit, route, and frequency dropdowns load Active values from `u_cdol_health_option` categories `MED_DOSE_UNIT`, `MED_INVENTORY_UNIT`, `MED_ROUTE`, and `MED_FREQUENCY`. A fresh table remains empty until a district administrator adds values.
- Each dropdown's italicized `Other` action temporarily replaces that dropdown with a text field, plus button, and Cancel button. A successful plus action restores the dropdown with the new value selected; Cancel restores it without creating a value. The plus action trims and normalizes the value, stores the same first-letter-capitalized text as Display Value and Description, and generates a lowercase Code with all whitespace removed. Display Value/Description are limited to 100 characters, Code is limited to 40, and duplicates select the existing option.
- Add/Edit Medication accepts only Active values from the four medication option categories. All four medication fields store stable option codes while the UI resolves their current display labels.
- `/admin/district/healthsetup/cdolhealthoptions.html` provides the district CDOL Health Code Sets manager. It follows the native Code Set pattern with a category selector, conditional Show Inactive checkbox and count immediately before Add Code, value table, and edit drawer. Administrators can add codes, change display labels, mark values Active or Inactive, and reorder the main grid with Move up and Move down buttons. Inactive values are hidden by default; when shown, they remain below all Active values and reorder only within the Inactive group. The drawer places Display Value, Code, and Active on one aligned row, with the Active checkbox centered below its label. Display order is assigned automatically and is not typed in the drawer. Codes are immutable after creation and rows are not deleted.
- PowerSchool supplies the shared option table's ID and standard created/modified audit columns. The application does not submit those fields.
- Enhanced Navigation catalogs the manager under **District Management → Health**, after native Health Code Sets, using `districtLevelContext = 2`. The page also displays a District Office-only warning instead of the manager when rendered outside District Office context.
- Inventory quantities use spaced remaining/original formatting such as `2.75 / 5 Pills` for readability.
- Add/edit and removal use one PowerSchool drawer with internal modes so medication context is preserved.
- Reversal is not exposed in the nurse-facing inventory workflow. A future correction workflow must be designed separately from medication physically returning to school.
- The full inventory workflow has been validated successfully on the PowerSchool test server, including medication creation, required inventory, multiple inventory rows, read-only lots, additions, FIFO deductions, insufficient-inventory blocking, decimal quantities, warning thresholds, duplicate prevention, and medication-name normalization.
- The initial student-specific Medication Administration page is implemented as one Administer Medication button followed directly by a simple administration-history table. Inventory is not displayed on the page. The drawer limits medication selection to medications with inventory available and records administered date/time, quantity, staff member, and notes. Routine administrations save directly without a redundant confirmation modal; required-field validation, available-inventory validation, save-in-progress protection, and inline medication details remain in place.
- The Administer Medication button remains visible even when no medication is available. In that case, the drawer explains that medication must first be added through the Medication Inventory page. The administration drawer uses compact spacing consistent with the other medication drawers.
- The administration drawer repeats the Inventory page's warning colors in compact status pills. Available Inventory shows the medication's current non-normal status. The Quantity Administered pill recalculates live from the projected inventory remaining after the entered quantity, so it can change from Normal to Low Inventory, Critical Inventory, or Last of Inventory before saving. Last of Inventory uses the Out styling but accurately describes administering the remaining amount. Invalid or excessive quantities do not show a projected pill, the no-available-medication message displays Out of Inventory, and Normal remains unmarked.
- The Inventory and Administration grid toolbars provide matching low-emphasis, left-arrow navigation links while keeping Add Medication and the Administration page's Administer Medication button as the primary actions. Administration links to `← View Medication Inventory`; Inventory links to `← Administer Medication`; and all links preserve the current student's PowerSchool FRN. The no-inventory administration drawer guidance also links directly to that student's inventory.
- When history contains more than one medication definition, the administration table provides a medication filter that distinguishes medication name and prescribed dosage.
- Each given administration is stored as one `ADMINISTRATION` row in the existing inventory transaction ledger. The row contains medication-detail snapshots and its negative quantity is consumed by the same FIFO calculation used for other deductions.
- Administration history includes an Actions column matching the Health Log pattern. The pencil opens an auditable Correct Administration drawer; the minus opens an Entered-in-Error drawer whose Save action requires confirmation. Corrections never PUT or DELETE the original administration.
- The correction drawer uses the same full-width alternating row layout as the administration and inventory drawers. Its summary and date/staff rows are gray, quantity and notes rows are white, and the required correction reason is visually separated in a light-blue section that follows the PowerSchool `feedback-info` color treatment without presenting it as an informational message.
- `ADMINISTRATION_CORRECTION` rows store the corrected administration snapshot and apply only the inventory quantity difference. `ADMINISTRATION_VOID` rows restore the current effective quantity. Both reference the original administration, require a reason, and capture the correction's date, time, and user. History shows one effective row labeled Corrected or Entered in Error, retains the correction audit details, and disables further actions after an entry is marked Entered in Error.
- The final Entered-in-Error confirmation dialog uses padded message content so its warning text and action buttons are not crowded against the dialog edges.
- The Edit Inventory drawer labels its transaction table `Inventory Activity`. It includes administrations, removals, entered-in-error offsets, and quantity-changing corrections, while excluding documentation-only administration corrections whose inventory delta is zero. Correction activity shows the correction date, correcting user, and correction reason. Corrected original administrations use the same compact status pill as Administration history; Entered in Error uses the red warning version.
- Successful routine administrations, corrections, and entered-in-error actions display a PowerSchool `feedback-confirm` message inside the rounded administration table container. It clears automatically after five seconds through a browser timer that explicitly schedules the Angular UI update.
- Health-log and active-staff reads are served by SQL-backed JSON pages in this plugin.
- The application no longer calls the `net.cdolinc.health.healthLog.logs` or `net.cdolinc.health.healthLog.staff` PowerQueries at runtime.
- The internal schema API permission mappings formerly supplied by `cdol_health_log_pqs` are maintained in this repository. Medication custom-page writes do not require external API field access requests.
- The default VS Code build creates two installable plugins from the one repository and source `plugin.xml`: the main plugin without `permissions_root`, and a `CDOL Health Log - Data Access` plugin containing the permission mappings without `user_schema_root` or application files.
- PowerSchool rejects `/ws/district/codeset` as a target in a plugin permission-mapping file because that file cannot grant access to core-resource routes. Medication and Health Log option reads and additions use the internal schema API for `u_cdol_health_option`. The Health Log page receives only GET and POST access; option maintenance remains on the district manager.
- New Health Log records use Active options from `HEALTH_COMPLAINT`, `HEALTH_DESTINATION`, and `HEALTH_CONVERSATION`. Complaint and Destination store one code and retain the italicized `Other` workflow. Communication Methods display active options as checkboxes, require at least one choice, and store selected codes comma-separated in `conversation_type`; `+ Add communication method` creates and immediately checks a reusable method. History resolves combined codes to comma-and-space-separated labels. Save remains disabled while any add is open, pending, or failed. Treatment remains free text, Sport continues to use PowerSchool's native `Sports` Code Set, and `HEALTH_SPORT` is not exposed by the custom manager.
- Existing Health Log values are resolved by code or case-insensitive display value without bulk conversion. Active matches show the dropdown or checked communication methods while preserving the original stored value unless a selection is deliberately changed. A communication value is split on commas only when every segment resolves to a known method. Inactive matches and unmatched historical values display read-only and remain unchanged when another field is edited. History falls back to the original text when a value cannot be resolved.
- `docs/u_cdol_health_option_defaults.csv` contains the approved Medication and Health Log import values, including the expanded complaint list and Recess. Conversation Type defaults are Email, Phone, and In Person. The import contains no stored `Other` rows.

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
