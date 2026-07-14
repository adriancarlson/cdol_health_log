# Open Work and Questions

## Highest-priority implementation work

1. Add all existing project source files to the repository.
2. Inspect the current medication page and drawer code.
3. Add or verify the `inventory_unit` field in the medication UI.
4. Implement inventory-lot listing, count-in, refill, edit/correction, and save behavior.
5. Create the first inventory lot when a new medication and starting quantity are entered.
6. Implement FIFO inventory deduction.
7. Design and approve the administration record schema.
8. Build the table-based administration workflow.
9. Implement required missed-dose reasons and notes.
10. Add low-inventory and missed-administration alerts.
11. Implement permission and authorization controls.
12. Add audit-safe correction, reversal, parent pickup, disposal, and reconciliation workflows.
13. Add tests and PowerSchool plugin installation validation.

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
- Is parent pickup represented as a transaction type, a dedicated workflow, or both?
- Should medication definitions have start/end dates or a status outside the inventory table?
- What reports and exports are required?
- What exact plugin paths and PowerSchool APIs are already used by the current code?
