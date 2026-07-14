# Open Work and Questions

## Highest-priority implementation work

1. Package and install the current repository build on the PowerSchool test server.
2. Revalidate medication creation, required inventory, refills, and read-only historical lots.
3. Confirm the final dose-unit, inventory-unit, route, and frequency lists with the nurse.
4. Install and validate the simplified one-row inventory transaction schema and permissions.
5. Test derived FIFO balances across one and multiple lots, reversal, and insufficient inventory handling.
6. Confirm the supported PowerSchool server-side mechanism for preventing simultaneous removals from exceeding available inventory.
7. Add controlled-medication reconciliation and returned-to-school workflows after nurse review.
8. Design and approve the administration record schema.
9. Build the table-based administration workflow.
10. Implement required missed-dose reasons and notes.
11. Add low-inventory and missed-administration alerts.
12. Complete authorization testing with nurse, ordinary staff, district, and cross-school accounts.
13. Add automated tests and PowerSchool plugin installation validation.

## Deployment cleanup

- After refreshing the test server, install both generated plugins and validate the new `u_student_med_inv_txn` schema with the old `cdol_health_log_pqs` plugin disabled.
- The permission mappings expose the full schema API action set consistently for all four tables. Confirm during testing that application code still treats historical inventory lots and transaction rows as read-only and never issues PUT or DELETE requests for them.
- After health-log reads, staff dropdowns, and schema API writes pass that validation, uninstall and archive the separately maintained `cdol_health_log_pqs` repository and plugin.

## Open design questions

These should be resolved explicitly before Codex hard-codes behavior:

- What is the final approved route list?
- Should `Other` route exist as a controlled value, and where is its explanation stored?
- What are the final dose and inventory unit lists?
- Is low inventory configured globally, per school, or per medication?
- Is a low-inventory threshold a quantity, a number of doses, or both?
- Where is the expected administration schedule stored?
- How are school days, weekends, holidays, absences, and non-school days handled?
- How is PRN excluded from false missed-dose alerts?
- Is the reminder configured per user, school, medication, or district?
- Which PowerSchool security groups or roles have access?
- Can an administration record be edited, or must it be reversed and recreated?
- How are controlled-medication counts reconciled?
- Does each administration need a second-person verification option?
- How should partial tablets, liquid doses, and unit conversion be handled?
- Should medication returned after parent pickup create a newly counted lot? Current recommendation: yes.
- Should medication definitions have start/end dates or a status outside the inventory table?
- What reports and exports are required?
- What exact plugin paths and PowerSchool APIs are already used by the current code?
