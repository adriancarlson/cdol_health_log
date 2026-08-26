# Open Work and Questions

## Highest-priority implementation work

1. Package, install, and test the initial student Medication Administration page and the new `ADMINISTRATION` transaction fields.
2. Confirm administration saves create exactly one deduction, update FIFO balances, refresh the available-medication list, and appear once in administration history.
3. Confirm the supported PowerSchool server-side mechanism for preventing simultaneous deductions from exceeding available inventory.
4. Install and test district Health Code Set creation plus in-context medication-option and removal-type creation with both administrator and non-administrator users who are authorized for Medication Inventory.
5. Import and test the approved Health Log defaults, controlled dropdowns, Communication Methods checkbox combinations and comma-separated storage, historical-value fallbacks, and in-context additions.
6. Install and validate daily gap calculation against real `Calendar_Day` records, transfers, weekends, non-session
   days, first-inventory boundaries, the current-day cutoff, and District Office student context.
7. Validate Not Given creation, reason correction, conversion to Given, effective reporting, and inventory effects.
8. Decide whether non-daily schedules need structured scheduling beyond the current Daily-versus-PRN behavior.
9. Complete authorization testing with nurse, ordinary staff, district, and cross-school accounts.
10. Add controlled-medication reconciliation and returned-to-school workflows after nurse review.
11. Add automated tests and PowerSchool plugin installation validation.
12. Install and validate the append-only Corrected and Entered-in-Error administration workflows, including inventory deltas, audit metadata, repeated corrections, and action locking after void.
13. Install and validate inventory-entry corrections with both `ADDED_IN_ERROR` and the existing/new Wrong Number Entered code forms, including partial corrections, fully hidden corrected lots, adjusted denominators, and preserved Inventory Activity history.

## Deployment cleanup

- After refreshing the test server, install both generated plugins and validate the expanded `u_student_med_inv_txn` correction fields with the old `cdol_health_log_pqs` plugin disabled.
- The permission mappings expose the full schema API action set consistently for the medication tables and `u_cdol_health_option`. Confirm during testing that application code still treats historical inventory lots and transaction rows as read-only and never issues PUT or DELETE requests for them.
- Populate and approve the initial medication values from the district CDOL Health Code Sets page before Medication Inventory is released to nurses. Import `docs/u_cdol_health_option_removal_type_defaults.csv` before testing Remove Inventory, and confirm each existing transaction code still displays its expected label. Before importing the updated template into an existing environment, check for the previously generated `wrongnumberentered` option and do not create a duplicate Wrong Number Entered row; both code forms already receive the same correction behavior. Confirm an empty table remains empty when Medication Inventory is opened.
- The UI suppresses duplicate values, but the PowerSchool extension table does not currently enforce a database uniqueness constraint; simultaneous identical additions remain a concurrency risk to test.
- Health Log permission mappings grant GET and POST to the full shared `u_cdol_health_option` route; PowerSchool cannot restrict that POST permission by `codetype`. Verify the intended nurse role can add options and that unauthorized users cannot access the Health Log page.
- After health-log reads, staff dropdowns, and schema API writes pass that validation, uninstall and archive the separately maintained `cdol_health_log_pqs` repository and plugin.

## Open design questions

These should be resolved explicitly before Codex hard-codes behavior:

- Who owns ongoing review, deactivation, and cleanup of values added to the shared Health option table?
- Should a future report include unresolved calculated gaps, stored effective Not Given events, or separate views for both?
- How should medication discontinuation be represented so a daily definition no longer creates future expected rows?
- Which PowerSchool security groups or roles have access?
- How are controlled-medication counts reconciled?
- Does each administration need a second-person verification option?
- Should medication returned after parent pickup create a newly counted lot? Current recommendation: yes.
- Should medication definitions have start/end dates or a status outside the inventory table?
- What reports and exports are required?
- What exact plugin paths and PowerSchool APIs are already used by the current code?
