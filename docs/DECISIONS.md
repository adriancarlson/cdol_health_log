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
21. Inventory removals use an append-only transaction ledger tied directly to affected lots.
22. One event may create multiple transaction rows with a shared event key when FIFO spans lots.
23. Existing inventory lots are read-only after creation.
24. Corrections use compensating reversal events rather than editing or deleting history.
25. Added-in-error corrections, parent pickup, disposal, lost/damaged medication, and other removal require notes.
26. Medication editing, inventory removal, and transaction reversal share one drawer; nested PowerSchool drawers are not used.

## Superseded or rejected approaches

- Do not create a new medication row for every refill.
- Do not store only one mutable inventory quantity that loses refill history.
- Do not use a calendar as the primary daily administration interface.
- Do not allow arbitrary route text.
- Do not use `cc`.
- Do not place timing or an active flag on each inventory lot merely to represent medication scheduling.
