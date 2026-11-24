/**
 * MUI Fab styled as the Material 3 Expressive FAB (floating action button): the "+" on the Today
 * page that starts a new task or event.
 *
 * `<Fab aria-label="New task or event"><AddIcon /></Fab>`, or with `href` / `component={Link}`
 * for a link. An icon-only FAB needs `aria-label`: it's the button's only name.
 * Extended (with a label): `<Fab variant="extended"><AddIcon />New task</Fab>`.
 *
 * | MUI `color`                 | M3 colour                                     |
 * | --------------------------- | --------------------------------------------- |
 * | `primary` (and the default) | `primary-container`, `on-primary-container`   |
 * | `secondary`                 | `secondary-container`, `on-secondary-container` |
 * | `tertiary`                  | `tertiary-container`, `on-tertiary-container` |
 * | any other                   | looks like primary                            |
 *
 * One size, 56×56px: MUI's `size` has no effect. Where a FAB sits on a page is the page's job.
 *
 * Values are Google's published M3 values (Jetpack Compose `FabBaselineTokens`,
 * `FabPrimaryContainerTokens`, `FabSecondaryContainerTokens`, `ExtendedFabSmallTokens`, token
 * version 0.14).
 */
import { corner, elevation, motion, scheme, stateLayer, transition, typescale, withOpacity } from '../m3';

const percent = (opacity) => `${opacity * 100}%`;
const noMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };
const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);

const content = 'var(--m3-fab-content)';
// The state layer: the content colour laid over the container at --m3-fab-state.
const background = `color-mix(in srgb, ${content} var(--m3-fab-state), var(--m3-fab-container))`;

/** The container and content colours of one M3 colour role, e.g. colors('secondary'). */
const colors = (role) => ({
  '--m3-fab-container': scheme(`${role}-container`),
  '--m3-fab-content': scheme(`on-${role}-container`),
});

// ---------------------------------------------------------------------------------------------
// Styles
//
// The state rules only set CSS variables (--m3-fab-*); the root rule turns them into CSS.
// No CSS property may end in "label" (see button.js).

/** The `MuiFab` entry of the theme's `components` (see theme.js). */
export const fabOverrides = {
  defaultProps: {
    // M3 shows a focus ring instead of MUI's pulsing focus ripple.
    disableFocusRipple: true,
  },
  styleOverrides: {
    root: {
      ...colors('primary'),
      '--m3-fab-state': '0%',

      // One size: these also beat MUI's `size` and `variant="extended"` sizes.
      width: 56,
      height: 56,
      minHeight: 0,
      borderRadius: corner.large,
      color: content,
      backgroundColor: background,
      boxShadow: elevation(3),
      // Between the icon and the label of an extended FAB.
      gap: 8,
      '& .MuiSvgIcon-root': { fontSize: 24 },
      transition: transition(['background-color', 'box-shadow'], motion.defaultEffects),
      ...noMotion,

      // MUI sets its own colors on hover and in its `color` styles; repeat ours so they win.
      '&:hover, &.Mui-focusVisible': { backgroundColor: background },

      // Hover only on devices that can hover, so it doesn't stick after a tap.
      '@media (hover: hover)': {
        '&:hover': { '--m3-fab-state': percent(stateLayer.hover), boxShadow: elevation(4) },
      },
      // After hover, so focus and pressed win over it. (MUI sets its own shadows here too.)
      '&.Mui-focusVisible': {
        '--m3-fab-state': percent(stateLayer.focus),
        boxShadow: elevation(3),
        outline: `3px solid ${scheme('secondary')}`,
        outlineOffset: 2,
      },
      // Pressed: back down to elevation 3. The press color is MUI's ripple, in the content color
      // and scaled to 10% by MuiButtonBase in theme.js.
      '&:active': { boxShadow: elevation(3) },

      '&.MuiFab-secondary': colors('secondary'),
      '&.MuiFab-tertiary': colors('tertiary'),

      // Extended: the M3 small extended FAB.
      '&.MuiFab-extended': {
        width: 'auto',
        minWidth: 80,
        height: 56,
        padding: '0 16px',
        ...typescale('title-medium'),
      },

      // M3 FABs have no disabled state; this is M3's usual disabled look.
      '&.Mui-disabled': {
        '--m3-fab-container': onSurface(0.12),
        '--m3-fab-content': onSurface(0.38),
        '--m3-fab-state': '0%',
        color: content,
        backgroundColor: background,
        boxShadow: 'none',
      },

      // Windows High Contrast drops the shadow, and the fill is the page colour: draw the edge.
      // Only here, so the 56px size and 16px padding stay the same everywhere else.
      '@media (forced-colors: active)': {
        border: '1px solid ButtonText',
        // The icon in the same colour as the edge, also on a link FAB (the browser would use the
        // link colour there).
        color: 'ButtonText',
        // A disabled FAB in the system's disabled color, like the browser's own disabled buttons.
        '&.Mui-disabled': { color: 'GrayText', borderColor: 'GrayText' },
      },
    },
  },
};
