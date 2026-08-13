# Project Context

## Project

**Name:** Medication Administration  
**Platform:** PowerSchool SIS  
**Primary purpose:** Build a school nurse workflow for medication inventory and medication administration, including controlled medications, inventory auditing, daily administration records, missed-dose handling, and alerts.

## Broader PowerSchool health context

The district already works with PowerSchool health and medical information, including:

- Daily health logs
- Communication logs
- Enrollment and annual medical forms
- Medical alerts
- Immunizations
- PDF attachments
- OTC medication permissions
- Prescription medication and Medical Authorization information
- School-specific annual forms

This project is intended to fill medication inventory and administration workflow gaps while keeping the work inside PowerSchool.

## Intended users

School nurses and other specifically authorized staff.

Access must be limited to authorized personnel. Visibility alone is not sufficient security; permissions and write operations should be protected using the strongest PowerSchool-supported controls available.

## Technical context

The user's common PowerSchool customization stack includes:

- PowerSchool custom pages and plugins
- Oracle SQL
- AngularJS 1.x
- RequireJS
- jQuery
- JavaScript, preferably ES6+ where supported
- PowerQueries and PowerSchool APIs when appropriate

## Privacy and safety

The repository must not contain actual student health information, medication records, credentials, tokens, or production database exports. Use clearly fictional test data only.
