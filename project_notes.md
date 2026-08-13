```markdown id="rx_admin_notes_v2"
# Prescription Administration & Medication Inventory Notes

## 1. Overall Goal

- Track **prescription administration** for students, especially **controlled medications**
- Document **who administered medication daily**
- Ensure accurate tracking of **dosage, inventory, and compliance**

---

## 2. Core Medication Structure

### Standard Medication Fields

Each medication should include:

- Name
- Dose (amount given per administration)
- Units
- Frequency
- Timing
- Route

### Example Scenarios

- **Daily Medication**
  - Vyvanse 10 mg daily at lunch (oral)
- **As Needed Medication**
  - Zofran 4 mg as needed for nausea (sublingual)

### Key Clarification

- The **dose (e.g., 10 mg)** is the **amount given each time**, not the total supply
- Inventory is tracked separately:
  - Example:
    - 10 mg dose daily
    - Student brings in **30 pills (each 10 mg)**
- System should include a field like:
  - **"Amount Brought to School"** (e.g., 30 pills)

---

## 3. Administration Tracking

### Structure

- Use a **table format** (calendar view not required)
- Table should include **only days when medication was administered**
- If a **day is skipped** when medication _should have been given_:
  - Trigger an **alert**
  - Require a **note/reason**

### Required Fields

- Date of administration
- Time of administration
- Dosage given
- Route (dropdown + free form option)
- Frequency (daily, as needed, free form)
- Person administering (may tie into Health Log)
- Notes

### Alerts & Validation

- Alert if a **dose is missed**
- Require **reason for non-administration**:
  - Dropdown options:
    - Student not sick
    - Student ill
    - Student refused
    - Student absent
    - Other (free text)
- Visual indicators:
  - Color warning when medication is **running low**

---

## 4. Medication Inventory

### Inventory Tracking

- Track:
  - Medication name (free form allowed, e.g., Zofran, migraine meds)
  - Dose (per administration)
  - Units (mg, mL, units, pill, etc.)
  - Quantity brought in (**Amount Brought to School**)
  - Date brought in
  - Person who counted it
- Allow **multiple inventory entries (rows)** per medication
- Ability to:
  - Add additional inventory batches
  - Maintain a **running total**

### Adjustments

- Example scenarios:
  - Parent picks up medication (e.g., takes 3 pills home)
  - Inventory should adjust accordingly

### Notes

- Notes field available for both:
  - Inventory entries
  - Administration records

---

## 5. Units & Routes

### Common Dosage Units

- Milligrams (mg)
- Milliliters (mL)
- Units
- Pill
- Other (free form option)

### Routes

- Oral
- Nasal
- Sublingual
- Buccal
- Subcutaneous
- Rectal
- Other (free form option)

---

## 6. Data Entry Considerations

### Free Form vs Structured

- Some fields should allow **free form input**:
  - Medication name
  - Route (with dropdown + "Other")
  - Frequency (with dropdown + "Other")

### Important Safeguards

- Clearly mark fields that require extra attention:
  - “_Be sure to double-check spelling and dosage_”
- Encourage users to **slow down and verify entries**

### Dosage Handling

- Dosage values:
  - Must support **integers and decimals**
  - Units: mg, mL, pill, etc.
- Explicit separation between:
  - **Dose per administration**
  - **Inventory quantity**

---

## 7. Alerts & Automation

### Daily Alerts

- Configurable **daily alert time**
- Notify when:
  - Medication needs to be administered
  - A scheduled dose was missed

### Gap Detection

- If a required administration is missing:
  - Flag the gap
  - Require reason entry

### Visual Indicators

- Color indicators for:
  - Low inventory
  - Missed doses

### Future Enhancements

- Possibly tie into:
  - Broader health system
  - Automated reminders
- Add **“More To Do” tracking list**

---

## 8. Additional Notes / Ideas

- Mark student as **daily medication required**
- Track **time remaining until next dose**
- “Now” indicator for immediate administration needs
- Consider integration with **Health Log** for tracking staff/administering user
- Allow tracking of **controlled medications with stricter accountability**
```
