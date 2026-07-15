# Decisions Made

## Confirmed workflow decisions

1. The administration experience will be table-based, not calendar-based.
2. Medication name remains free-form.
3. Route uses a controlled dropdown and is not unrestricted free text.
4. Do not use `cc` as a dosage unit.
5. Inventory timing or administration timing does not belong on an inventory lot.
6. An `active_flag` was removed from the simplified inventory design.
7. Keep one medication definition row for a student's medication.
8. A refill creates a new inventory lot linked to the medication.
9. Never overwrite the original lot quantity or its audit information.
10. Deduct inventory FIFO from the oldest lot with remaining quantity.
11. Inventory needs count-in date, counted-by user, notes, totals, and parent-pickup deductions.
12. Missed scheduled doses require a reason.
13. The system needs missed-gap and low-inventory alerts.
14. Daily reminder timing should be configurable.
15. Access is limited to authorized staff.
16. The workflow must support controlled medications.
17. Medication administration should identify who gave the dose and preserve an auditable record.
18. Dose values must support whole numbers and decimals.
19. Frequency must support daily and PRN behavior without treating PRN as a missed daily dose.
20. Sensitive medication entries should include a double-check or confirmation step.
21. Inventory removals use an append-only transaction ledger with one row per real-world event.
22. FIFO lot balances are derived from immutable received lots and the medication-level transaction history; transactions are not split into per-lot allocation rows.
23. Existing inventory lots are read-only after creation.
24. The nurse-facing inventory workflow does not expose reversal. A separate, clearly labeled correction workflow must be designed before corrections are implemented.
25. Added-in-error corrections, parent pickup, disposal, lost/damaged medication, and other removal require notes.
26. Medication editing and inventory removal share one drawer; nested PowerSchool drawers are not used.
27. Nurses do not configure an inventory quantity per dose. During administration they enter the actual quantity used in the inventory unit, while the prescribed dosage is displayed in parentheses as reference.
28. The entered administration quantity supports decimals and becomes the auditable inventory deduction.
29. Low inventory is based on the percentage of inventory remaining in the current replenishment cycle, not all inventory historically received.
30. Adding inventory automatically resets the alert baseline to the total quantity available after the addition; deductions do not reset it.
31. Inventory status levels use fixed system thresholds: Normal above 20%, Low above 10% through 20%, Critical above 0% through 10%, and Out at 0%. Nurses do not configure these levels.
32. Normal inventory has no visible status label, and inventory percentages are not displayed. Warning color, border, and the full label `Low Inventory`, `Critical Inventory`, or `Out of Inventory` appear left-aligned on the single lot row or, when multiple lots exist, only on the Total row; the quantity remains right-aligned. Out of Inventory uses a subtle pale-red treatment.
33. The main inventory page uses `Add Medication` for creating a medication definition and its starting inventory; `Add Inventory` remains the action for adding inventory to an existing medication.
34. A student cannot have duplicate medication definitions with the same normalized medication name, numeric dosage amount, and dose unit. A different dosage amount or dose unit is allowed. The form disables Save and directs the nurse to add inventory to the existing medication.
35. Medication names are trimmed, repeated internal spaces are collapsed, and the first character is capitalized before saving. The remainder of the entered capitalization is preserved; full title case is not used.
36. Remaining/original inventory quantities display spaces around the slash, such as `2.75 / 5 Pills`, to keep decimal quantities readable.
37. A given medication administration is stored as one `ADMINISTRATION` row in `u_student_med_inv_txn`. The row holds administration snapshots and its negative quantity is the inventory deduction, avoiding a two-record partial-save risk.
38. The initial Administration page is student-specific and contains one Administer Medication button followed by one history table with no section heading. Inventory is not displayed on the page; the drawer's medication selector includes only medications whose calculated available inventory is greater than zero.
39. Administration history can contain mixed medications. When more than one medication is present, a medication-and-dosage filter is available above the table.
40. The Administer Medication button remains visible when no inventory is available. Opening it shows guidance to add medication through the student's Medication Inventory page instead of hiding or disabling the action.

## Superseded or rejected approaches

- Do not create a new medication row for every refill.
- Do not store only one mutable inventory quantity that loses refill history.
- Do not use a calendar as the primary daily administration interface.
- Do not allow arbitrary route text.
- Do not use `cc`.
- Do not place timing or an active flag on each inventory lot merely to represent medication scheduling.
- Do not create per-lot transaction allocations or event grouping keys for a single inventory event.
- Do not present medication physically returning to school as a reversal of the earlier removal.
