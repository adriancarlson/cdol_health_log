# Missed medication icons

The selected design is Font Awesome Free 5.15.4 `prescription-bottle-alt`, displayed
by React Icons as `FaPrescriptionBottleAlt`. It replaces the custom
bottle-and-exclamation design. The active student variant has a solid blue cap,
blue-outlined bottle body, and red plus. The original outlined-cap variant is
retained as a backup.

- Source: https://github.com/FortAwesome/Font-Awesome/blob/5.15.4/svgs/solid/prescription-bottle-alt.svg
- Author: Font Awesome (https://fontawesome.com)
- SVG license: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Upstream license: https://github.com/FortAwesome/Font-Awesome/blob/5.15.4/LICENSE.txt

All variants retain the 384-by-512 view box. The active student icon displays at
21 by 28 pixels; the header and unused backup remain 15 by 20.
The active student icon and backup inset the cap/body contours for a 32-unit blue
stroke and fill the cross shape red. Only the active version fills the cap blue.
The white header retains the original solid bottle geometry and cross cutout.
CDOL changes colors, opacity, default sizes, and accessible titles.
Attribution is embedded in all three SVGs; retain it when packaging or modifying them.

## Variants

- `/images/cdol_health_log/icon-missed-medication.svg`: solid blue cap and blue
  outline (`#05729d`) with a red plus (`#c22026`) for student alerts, matching the palette in
  CDOL Custom Alerts' `/images/img/icon-meds.svg`.
- `/images/cdol_health_log/icon-missed-medication-outline.svg`: unused backup of
  the 26.8.7.16 blue-outline/red-plus design. No alert points to this file.
- `/images/cdol_health_log/icon-missed-medication-white.svg`: white for the main header,
  with a 50%-opacity cap and a solid-white body. This matches the secondary-shape
  opacity used by the native PDS printer and rolodex icons inspected on
  `/admin/ui_examples/navigation/showPdsIcons.html`. The translucent cap picks up
  the header background color without a hard-coded gray or blue.

All are standalone SVGs with transparent backgrounds. The white header has
a cross cutout; the student icon and outline backup have a red cross. They
require no React, icon font, CDN, or other plugin. Preserve the 3:4 aspect ratio;
center the image in a square toolbar container instead of stretching it.

The white variant is wired to the school-level header counter in version
26.8.7.12. It uses the shared CDOL toolbar badge, separate from the icon artwork,
and supplies an accessible count label. Since 26.8.7.15, it links to the missed
daily administration report in the CDOL custom reports plugin.
The student variant is wired to the student-header alert in 26.8.7.16 and updated
to a solid blue cap, blue outline, red plus, and larger size in 26.8.7.18; see
`MISSED_MEDICATION_STUDENT_ALERT.md`.
See `MISSED_MEDICATION_HEADER.md` for behavior, dependencies, and testing.
