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
 * States: hover 8% (only on devices that can hover) and focus 10% state layers in the label color;
 * an on chip also rises to elevation 1 on hover. Keyboard focus shows a 3px secondary ring. The
 * press color is MUI's ripple. Turning a chip on, the checkmark grows in, the fill fades in and the
 * label moves over; nothing animates under "reduce motion". In Windows High Contrast the
 * checkmark is drawn in the system text color.
 *
 * Values are Google's published M3 values (Jetpack Compose `FilterChipTokens`).
 */
import { corner, elevation, motion, scheme, stateLayer, transition, typescale, withOpacity } from '../m3';

const percent = (opacity) => `${opacity * 100}%`;
const noMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };
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
      '--m3-chip-elevation-hover': 'none',

      height: 32,
      borderRadius: corner.small,
      padding: 0,
      // The border is always 1px (transparent when on), so the content never moves by a pixel.
      border: '1px solid var(--m3-chip-outline)',
      color: labelColor,
      backgroundColor: background,
      boxShadow: 'none',
      ...typescale('label-large'),
      transition: transition(['background-color', 'border-color', 'color', 'box-shadow'], motion.defaultEffects),
      ...noMotion,

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
        transition: transition(['width', 'margin-left'], motion.defaultEffects),
        ...noMotion,
      },
      // A chip given its own icon or avatar keeps it, without a checkmark next to it.
      '&:has(> .MuiChip-icon, > .MuiChip-avatar)::before': { display: 'none' },

      // MUI sets its own colors and shadows on these states and in its `color` and `variant`
      // styles; repeat ours so they win.
      '&:hover, &.MuiChip-clickable:hover, &.Mui-focusVisible': { backgroundColor: background },
      '&:active': { boxShadow: 'none' },

      // Only on devices that can hover, so the hover color doesn't stick after a tap.
      '@media (hover: hover)': {
        '&.MuiChip-clickable:hover': {
          '--m3-chip-state': percent(stateLayer.hover),
          boxShadow: 'var(--m3-chip-elevation-hover)',
        },
      },
      // After hover, so focus and pressed win over it.
      '&.MuiChip-clickable.Mui-focusVisible': {
        '--m3-chip-state': percent(stateLayer.focus),
        outline: `3px solid ${scheme('secondary')}`,
        outlineOffset: 2,
      },
      // Pressed: back down to elevation 0. The press color is MUI's ripple, in the label color and
      // scaled to 10% by MuiButtonBase in theme.js.
      '&.MuiChip-clickable:active': { boxShadow: 'none' },

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
        '--m3-chip-elevation-hover': elevation(1),
      },

      // M3 dims the colors, not the whole chip.
      '&.Mui-disabled': {
        opacity: 1,
        '--m3-chip-outline': onSurface(0.12),
        '--m3-chip-label-color': onSurface(0.38),
        '--m3-chip-state': '0%',
      },
      '&.Mui-disabled[aria-pressed="true"]': {
        '--m3-chip-container': onSurface(0.12),
        '--m3-chip-outline': 'transparent',
      },

      // Windows High Contrast paints the checkmark's background in the page color, so it would
      // vanish. Draw it in the system text color instead.
      '@media (forced-colors: active)': {
        '&::before': { forcedColorAdjust: 'none', backgroundColor: 'CanvasText' },
        '&.Mui-disabled::before': { backgroundColor: 'GrayText' },
      },
    },
    label: {
      padding: '0 15px 0 var(--m3-chip-label-start)',
      transition: transition(['padding-left'], motion.defaultEffects),
      ...noMotion,
    },
  },
};
