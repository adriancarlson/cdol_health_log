# Missed medication icons

The selected design is Font Awesome Free 5.15.4 `prescription-bottle-alt`, displayed
by React Icons as `FaPrescriptionBottleAlt`. It replaces the custom
bottle-and-exclamation design. The active student variant has a solid blue cap,
blue-outlined bottle body, red plus, and a borderless orange warning triangle
overlapping the lower-right corner. The original outlined-cap variant is
retained as a backup.

- Source: https://github.com/FortAwesome/Font-Awesome/blob/5.15.4/svgs/solid/prescription-bottle-alt.svg
- Author: Font Awesome (https://fontawesome.com)
- SVG license: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Upstream license: https://github.com/FortAwesome/Font-Awesome/blob/5.15.4/LICENSE.txt

The active student icon uses a 512-by-512 view box and displays at 28 by 28 pixels.
Only the canvas extends right for the badge: the bottle keeps its existing
21-by-28 displayed scale and original proportions. The header and unused backup
retain their 384-by-512 view box and 15-by-20 default display size.
The active student icon and backup inset the cap/body contours for a 32-unit blue
stroke and fill the cross shape red. Only the active version fills the cap blue.
The white header retains the original solid bottle geometry and cross cutout.
CDOL changes colors, opacity, default sizes, and accessible titles.
Attribution is embedded in all three SVGs; retain it when packaging or modifying them.

## Variants

- `/images/cdol_health_log/icon-missed-medication.svg`: solid blue cap and blue
  outline (`#05729d`) with a red plus (`#c22026`) for student alerts, matching the palette in
  CDOL Custom Alerts' `/images/img/icon-meds.svg`. An orange (`#e87518`) triangle
  with a white exclamation mark overlaps the lower-right body edge, leaving the
  red plus recognizable. In 26.8.7.22 the badge grew 10% and shifted left;
  26.8.7.23 increases it another 10% (21% total), keeping its bottom-center anchored.
  A luminance mask removes the bottle artwork around the triangle, creating
  a transparent gap rather than a painted outline. The visible badge and mask
  share the same path and transform; the 48-unit mask stroke produces about
  1.6 pixels of separation at the 28-pixel display size.
- `/images/cdol_health_log/icon-missed-medication-outline.svg`: unused backup of
  the 26.8.7.16 blue-outline/red-plus design. No alert points to this file.
- `/images/cdol_health_log/icon-missed-medication-white.svg`: white for the main header,
  with a 50%-opacity cap and a solid-white body. This matches the secondary-shape
  opacity used by the native PDS printer and rolodex icons inspected on
  `/admin/ui_examples/navigation/showPdsIcons.html`. The translucent cap picks up
  the header background color without a hard-coded gray or blue.

All are standalone SVGs with transparent backgrounds. The white header has
a cross cutout; the student icon and outline backup have a red cross. They
require no React, icon font, CDN, or other plugin. Preserve each asset's aspect
ratio: the active composite is square; header and backup are 3:4.

The white variant is wired to the school-level header counter in version
26.8.7.12. It uses the shared CDOL toolbar badge, separate from the icon artwork,
and supplies an accessible count label. Since 26.8.7.15, it links to the missed
daily administration report in the CDOL custom reports plugin.
The student variant is wired to the student-header alert in 26.8.7.16 and updated
to a solid blue cap, blue outline, red plus, and larger size in 26.8.7.18.
The borderless warning overlay is added in 26.8.7.21 and gains the larger,
left-shifted placement and transparent separation in 26.8.7.22; see
`MISSED_MEDICATION_STUDENT_ALERT.md`.
See `MISSED_MEDICATION_HEADER.md` for behavior, dependencies, and testing.
