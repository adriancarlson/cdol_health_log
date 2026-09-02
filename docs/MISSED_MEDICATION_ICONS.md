# Missed medication icons

The selected design is Font Awesome Free 5.15.4 `prescription-bottle-alt`, displayed
by React Icons as `FaPrescriptionBottleAlt`. It replaces the custom
bottle-and-exclamation design. Keep the medical cross exactly as supplied.

- Source: https://github.com/FortAwesome/Font-Awesome/blob/5.15.4/svgs/solid/prescription-bottle-alt.svg
- Author: Font Awesome (https://fontawesome.com)
- SVG license: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
- Upstream license: https://github.com/FortAwesome/Font-Awesome/blob/5.15.4/LICENSE.txt

The original geometry and 384-by-512 view box are unchanged. CDOL changes the
display color, opacity, default 15-by-20 size, and accessible title. The header
variant separates the existing cap and body into two paths for independent
opacity. Attribution is embedded in both shipped SVGs; retain it when packaging
or modifying the files.

## Variants

- `/images/cdol_health_log/icon-missed-medication.svg`: red (`#c22026`) for student alerts.
- `/images/cdol_health_log/icon-missed-medication-white.svg`: white for the main header,
  with a 50%-opacity cap and a solid-white body. This matches the secondary-shape
  opacity used by the native PDS printer and rolodex icons inspected on
  `/admin/ui_examples/navigation/showPdsIcons.html`. The translucent cap picks up
  the header background color without a hard-coded gray or blue.

Both are standalone SVGs with transparent backgrounds and cross cutouts. They
require no React, icon font, CDN, or other plugin. Preserve the 3:4 aspect ratio;
center the image in a square toolbar container instead of stretching it.

The white variant is wired to the school-level header counter in version
26.8.7.12. It uses the shared CDOL toolbar badge, separate from the icon artwork,
and supplies an accessible count label. It is informational until the report
exists; there is no placeholder link. Student-specific alerts remain deferred.
See `MISSED_MEDICATION_HEADER.md` for behavior, dependencies, and testing.
