/**
 * MUI Chip styled as the Material 3 Expressive filter chip: a toggle, like the saved views on the
 * Today page ("Everyone", "I'm responsible", "Ella").
 *
 * | State    | MUI prop                          |
 * | -------- | --------------------------------- |
 * | Off      | `aria-pressed={false}`            |
 * | On       | `aria-pressed={true}`             |
 * | Disabled | `disabled`                        |
 *
 * `<Chip label="Ella" aria-pressed={view === 'ella'} onClick={() => setView('ella')} />`
 *
 * The chip is on exactly when screen readers announce it as pressed: the theme reads `aria-pressed`
 * and draws the fill and the checkmark from it. MUI's `variant`, `color` and `size` have no effect
 * (M3 chips have one look and one size).
 *
 * A chip with `onClick` is a button with a touch area of at least 48×48px, and it takes up 48px of
 * height in the layout, so a neighbour never sits under its touch area. A chip without `onClick`
 * has the same look, but no states and no touch area.
 *
 * Values are Google's published M3 values (Jetpack Compose `FilterChipTokens`).
 */
import { corner, scheme, typescale, withOpacity } from '../m3';

const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);

const labelColor = 'var(--m3-chip-label-color)';
// The state layer: the label color laid over the container at --m3-chip-state.
const background = `color-mix(in srgb, ${labelColor} var(--m3-chip-state), var(--m3-chip-container))`;

// The Material Symbols "check" icon. The checkmark is the chip's ::before: its background, in the
// label color, shows through this icon as a mask.
const checkIcon =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E" +
  "%3Cpath d='M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E\")";

// ---------------------------------------------------------------------------------------------
// Styles
//
// The state rules only set CSS variables (--m3-chip-*); the root rule turns them into CSS.
// No CSS property may end in "label" (see button.js).

/** The `MuiChip` entry of the theme's `components` (see theme.js). */
export const chipOverrides = {
  styleOverrides: {
    root: {
      '--m3-chip-container': 'transparent',
      '--m3-chip-label-color': scheme('on-surface-variant'),
      '--m3-chip-outline': scheme('outline-variant'),
      '--m3-chip-state': '0%',
      // The checkmark is 0px wide when off, so the label sits 16px from the edge.
      '--m3-chip-check-width': '0px',
      '--m3-chip-check-margin': '0px',
      '--m3-chip-label-start': '15px',

      height: 32,
      borderRadius: corner.small,
      padding: 0,
      // The border is always 1px (transparent when on), so the content never moves by a pixel.
      border: '1px solid var(--m3-chip-outline)',
      color: labelColor,
      backgroundColor: background,
      boxShadow: 'none',
      ...typescale('label-large'),

      // The checkmark: 8px from the edge (7px + the border), 18px, then 8px to the label.
      '&::before': {
        content: '""',
        flex: 'none',
        width: 'var(--m3-chip-check-width)',
        height: 18,
        marginLeft: 'var(--m3-chip-check-margin)',
        backgroundColor: 'currentColor',
        maskImage: checkIcon,
        maskSize: '18px 18px',
        // Pinned to the left, so a growing width wipes the checkmark in from the left.
        maskPosition: 'left center',
        maskRepeat: 'no-repeat',
      },
      // A chip given its own icon or avatar keeps it, without a checkmark next to it.
      '&:has(> .MuiChip-icon, > .MuiChip-avatar)::before': { display: 'none' },

      // MUI sets its own colors and shadows on these states and in its `color` and `variant`
      // styles; repeat ours so they win.
      '&:hover, &.MuiChip-clickable:hover, &.Mui-focusVisible': { backgroundColor: background },
      '&:active': { boxShadow: 'none' },

      // A chip you can tap: a touch area of at least 48×48px, centered on the chip, and room for
      // it in the layout (32px + 2 × 8px), so a neighbour can't sit under it.
      '&.MuiChip-clickable': {
        marginBlock: 8,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          // 100% is the chip inside its border, 2px narrower than the chip.
          width: 'max(calc(100% + 2px), 48px)',
          height: 48,
          transform: 'translate(-50%, -50%)',
        },
      },

      '&[aria-pressed="true"]': {
        '--m3-chip-container': scheme('secondary-container'),
        '--m3-chip-outline': 'transparent',
        '--m3-chip-label-color': scheme('on-secondary-container'),
        '--m3-chip-check-width': '18px',
        '--m3-chip-check-margin': '7px',
        '--m3-chip-label-start': '8px',
      },

      // M3 dims the colors, not the whole chip.
      '&.Mui-disabled': {
        opacity: 1,
        '--m3-chip-outline': onSurface(0.12),
        '--m3-chip-label-color': onSurface(0.38),
      },
      '&.Mui-disabled[aria-pressed="true"]': {
        '--m3-chip-container': onSurface(0.12),
        '--m3-chip-outline': 'transparent',
      },
    },
    label: {
      padding: '0 15px 0 var(--m3-chip-label-start)',
    },
  },
};
