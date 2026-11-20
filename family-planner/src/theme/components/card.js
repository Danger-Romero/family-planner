/**
 * MUI Card and its parts styled as the Material 3 Expressive card.
 *
 * | M3 card type | MUI `variant`                 |
 * | ------------ | ----------------------------- |
 * | Elevated     | `elevation` (MUI's default)   |
 * | Filled       | `filled`                      |
 * | Outlined     | `outlined`                    |
 *
 * The type sets the shadow, so MUI's numeric `elevation` and `raised` props have no effect.
 * `color="error"` gives any type a 2px outline in the error color, for urgent items. (Our tokens
 * have no orange or warning role.)
 *
 * Values are Google's published M3 values (Jetpack Compose `ElevatedCardTokens`,
 * `FilledCardTokens`, `OutlinedCardTokens`).
 */
import { corner, elevation, motion, scheme, transition } from '../m3';

const noMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };

// ---------------------------------------------------------------------------------------------
// Types (ElevatedCardTokens, FilledCardTokens, OutlinedCardTokens)

/**
 * @typedef {object} TypeSpec
 * @property {string} container
 * @property {0 | 1 | 2} elevation At rest.
 * @property {0 | 1 | 2} hoverElevation
 * @property {string} [outline]
 */

/** @type {Record<string, TypeSpec>} */
const types = {
  elevation: { container: scheme('surface-container-low'), elevation: 1, hoverElevation: 2 },
  filled: { container: scheme('surface-container-highest'), elevation: 0, hoverElevation: 1 },
  outlined: {
    container: scheme('surface'),
    elevation: 0,
    hoverElevation: 1,
    outline: `1px solid ${scheme('outline-variant')}`,
  },
};

// ---------------------------------------------------------------------------------------------
// Styles
//
// The type rules only set CSS variables (--m3-card-*); the root rule turns them into CSS.
// No CSS property may end in "label" (see button.js).

/** The `MuiCard` entry of the theme's `components` (see theme.js). */
export const cardOverrides = {
  defaultProps: { variant: 'elevation' },
  styleOverrides: {
    root: {
      borderRadius: corner.medium,
      color: scheme('on-surface'),
      backgroundColor: 'var(--m3-card-container)',
      // MUI's Paper lightens dark-mode surfaces with a gradient; M3 colors come from the tokens.
      backgroundImage: 'none',
      boxShadow: 'var(--m3-card-elevation)',
      transition: transition(['box-shadow', 'opacity'], motion.defaultEffects),
      ...noMotion,

      variants: [
        ...Object.entries(types).map(([variant, spec]) => ({
          props: { variant },
          style: {
            '--m3-card-container': spec.container,
            '--m3-card-elevation': elevation(spec.elevation),
            '--m3-card-elevation-hover': elevation(spec.hoverElevation),
            ...(spec.outline && { border: spec.outline }),
          },
        })),
        // After the types, so it replaces the outlined card's 1px outline.
        { props: { color: 'error' }, style: { border: `2px solid ${scheme('error')}` } },
      ],
    },
  },
};

/** The `MuiCardContent` entry: 16px on every side (MUI adds 24px at the bottom). */
export const cardContentOverrides = {
  styleOverrides: {
    root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
  },
};

/** The `MuiCardHeader` entry: title in title-medium, subheader in body-medium. */
export const cardHeaderOverrides = {
  defaultProps: {
    slotProps: { title: { variant: 'titleMedium' }, subheader: { variant: 'bodyMedium' } },
  },
  styleOverrides: {
    root: { padding: 16 },
    subheader: { color: scheme('on-surface-variant') },
  },
};

/** The `MuiCardActions` entry: 16px around the buttons, 8px between them. */
export const cardActionsOverrides = {
  defaultProps: { disableSpacing: true },
  styleOverrides: {
    root: { padding: 16, gap: 8 },
  },
};
