/**
 * MUI Avatar styled for the family planner: who a task or event belongs to, filled for the person
 * responsible and outlined for people attending.
 *
 * `<Avatar role="img" aria-label="Anna">A</Avatar>` (responsible) or
 * `<Avatar variant="outlined" role="img" aria-label="Ella">E</Avatar>` (attending), with an initial
 * or an icon inside; `variant="dashed"` is someone who isn't involved, when picking who is. For a
 * family member, use `MemberAvatar` (src/components/MemberAvatar.jsx).
 * The variants are only visible: give every avatar `role="img"` and an `aria-label`.
 *
 * | `variant`                 | Look                                                   |
 * | ------------------------- | ------------------------------------------------------ |
 * | default (and any other)   | `primary` fill and edge, `on-primary` initial or icon  |
 * | `outlined`                | `primary` edge, no fill, `primary` initial or icon     |
 * | `dashed`                  | dashed `outline` edge, no fill, `on-surface-variant`   |
 *
 * 28×28px (a list of people can make it larger with `sx`), always round (MUI's `rounded` and
 * `square` look like the default). M3 has no avatar component of its own; this follows the Today
 * wireframe. The strong `primary` fill (not `primary-container`) keeps filled and outlined easy to
 * tell apart.
 */
import { scheme, typescale } from '../m3';

/** The `MuiAvatar` entry of the theme's `components` (see theme.js). */
export const avatarOverrides = {
  styleOverrides: {
    root: {
      // Also beats MUI's `rounded` / `square` shapes and its grey default colours (`colorDefault`).
      width: 28,
      height: 28,
      boxSizing: 'border-box',
      borderRadius: '50%',
      border: `2px solid ${scheme('primary')}`,
      backgroundColor: scheme('primary'),
      color: scheme('on-primary'),
      ...typescale('label-large'),
      '& .MuiSvgIcon-root': { fontSize: 18 },
      // Browsers leave out fills when printing; keep them, or responsible would print like
      // attending and a filled icon as an empty ring.
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',

      '&.MuiAvatar-outlined': {
        backgroundColor: 'transparent',
        color: scheme('primary'),
      },
      '&.MuiAvatar-dashed': {
        borderStyle: 'dashed',
        borderColor: scheme('outline'),
        backgroundColor: 'transparent',
        color: scheme('on-surface-variant'),
      },

      // Windows High Contrast repaints fills and text in system colours, which would make both
      // roles look alike. Keep the filled one filled, in the system's text colour. (The whole
      // border: MUI sets a 1px one here for its own default avatar.)
      '@media (forced-colors: active)': {
        forcedColorAdjust: 'none',
        border: '2px solid CanvasText',
        backgroundColor: 'CanvasText',
        color: 'Canvas',
        '&.MuiAvatar-outlined': { backgroundColor: 'transparent', color: 'CanvasText' },
        '&.MuiAvatar-dashed': { borderStyle: 'dashed', backgroundColor: 'transparent', color: 'CanvasText' },
      },
    },
  },
};
