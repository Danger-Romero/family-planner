/**
 * MUI Button styled as the Material 3 Expressive button.
 *
 * | M3 button type | MUI `variant` |
 * | -------------- | ------------- |
 * | Filled         | `contained`   |
 * | Tonal          | `tonal`       |
 * | Elevated       | `elevated`    |
 * | Outlined       | `outlined`    |
 * | Text           | `text`        |
 *
 * `size` is one of the five M3 Expressive sizes, `xsmall` to `xlarge` (default `small`, as in M3),
 * and `shape` is `round` (a pill, the default) or `square` (rounded corners).
 *
 * With the default `color` (primary) each type looks exactly like the M3 spec. `secondary`,
 * `tertiary` and `error` swap in that color role instead. (`success`, `info` and `warning` are
 * not color roles in M3, or in our Figma tokens, so they get no M3 styles.)
 */
import {
  corner,
  elevation,
  minTouchTarget,
  motion,
  scheme,
  stateLayer,
  transition,
  typescale,
  withOpacity,
} from '../m3';

const px = (value) => `${value}px`;

// ---------------------------------------------------------------------------------------------
// Sizes (ButtonXSmallTokens … ButtonXLargeTokens)

/**
 * @typedef {object} SizeSpec
 * @property {number} height
 * @property {number} padding Space between the container's edge and the label or icon, on both sides.
 * @property {number} iconSize
 * @property {number} iconGap
 * @property {string} type A role of the M3 type scale (`typeRoles` in m3.js).
 * @property {number} square Corner radius of the square shape.
 * @property {number} pressed Corner radius while pressed, for both shapes.
 * @property {number} outlineWidth
 */

// Extra small uses Compose's values (12px padding, 4px icon gap): its token file is known to be off.
/** @type {Record<string, SizeSpec>} */
const sizes = {
  xsmall: { height: 32, padding: 12, iconSize: 20, iconGap: 4, type: 'label-large', square: corner.medium, pressed: corner.small, outlineWidth: 1 },
  small: { height: 40, padding: 16, iconSize: 20, iconGap: 8, type: 'label-large', square: corner.medium, pressed: corner.small, outlineWidth: 1 },
  medium: { height: 56, padding: 24, iconSize: 24, iconGap: 8, type: 'title-medium', square: corner.large, pressed: corner.medium, outlineWidth: 1 },
  large: { height: 96, padding: 48, iconSize: 32, iconGap: 12, type: 'headline-small', square: corner.extraLarge, pressed: corner.large, outlineWidth: 2 },
  xlarge: { height: 136, padding: 64, iconSize: 40, iconGap: 16, type: 'headline-large', square: corner.extraLarge, pressed: corner.large, outlineWidth: 3 },
};

// ---------------------------------------------------------------------------------------------
// Types and colors (FilledButtonTokens, FilledTonalButtonTokens, ElevatedButtonTokens, …)

/**
 * @typedef {object} VariantSpec
 * @property {string} container
 * @property {string} label
 * @property {string} [outline]
 * @property {0 | 1 | 2} [elevation]
 * @property {0 | 1 | 2} [hoverElevation]
 * @property {string} disabledContainer
 * @property {string} disabledLabel
 */

const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);
const onSurfaceVariant = (opacity) => withOpacity(scheme('on-surface-variant'), opacity);

/**
 * The colors of one button type (`variant`) in one `color`.
 * @param {string} variant
 * @param {string} color
 * @returns {VariantSpec}
 */
function variantSpec(variant, color) {
  switch (variant) {
    case 'contained':
      return {
        container: scheme(color),
        label: scheme(`on-${color}`),
        elevation: 0,
        hoverElevation: 1,
        disabledContainer: onSurface(0.1),
        disabledLabel: onSurfaceVariant(0.38),
      };
    case 'tonal': {
      // M3's tonal button uses the secondary container.
      const role = color === 'primary' ? 'secondary' : color;
      return {
        container: scheme(`${role}-container`),
        label: scheme(`on-${role}-container`),
        elevation: 0,
        hoverElevation: 1,
        disabledContainer: onSurface(0.12),
        disabledLabel: onSurface(0.38),
      };
    }
    case 'elevated':
      return {
        container: scheme('surface-container-low'),
        label: scheme(color),
        elevation: 1,
        hoverElevation: 2,
        disabledContainer: onSurface(0.1),
        disabledLabel: onSurfaceVariant(0.38),
      };
    case 'outlined':
      return {
        container: 'transparent',
        // M3 Expressive's outlined button has a neutral label.
        label: color === 'primary' ? scheme('on-surface-variant') : scheme(color),
        outline: scheme('outline-variant'),
        disabledContainer: 'transparent',
        disabledLabel: onSurfaceVariant(0.38),
      };
    case 'text':
      return {
        container: 'transparent',
        label: scheme(color),
        disabledContainer: 'transparent',
        disabledLabel: onSurfaceVariant(0.38),
      };
  }
}

const variants = ['contained', 'tonal', 'elevated', 'outlined', 'text'];
const colors = ['primary', 'secondary', 'tertiary', 'error'];

// ---------------------------------------------------------------------------------------------
// Styles
//
// The size, shape and variant rules only set CSS variables (--m3-button-*). The root rule turns
// them into CSS, so each state (hover, focus, pressed, disabled) is written once.
//
// Careful: no CSS property may end in "label" (like --m3-button-label). Emotion reads `label:`
// in the CSS as the class name, which breaks the selector and drops all the styles.

const label = 'var(--m3-button-label-color)';
const container = 'var(--m3-button-container)';
// The state layer: the label color laid over the container at --m3-button-state.
const background = `color-mix(in srgb, ${label} var(--m3-button-state), ${container})`;
const percent = (opacity) => `${opacity * 100}%`;

/** The `MuiButton` entry of the theme's `components` (see theme.js). */
export const buttonOverrides = {
  defaultProps: {
    size: 'small',
    // M3 shows a focus ring instead of MUI's pulsing focus ripple.
    disableFocusRipple: true,
  },
  styleOverrides: {
    root: {
      '--m3-button-shape': 'var(--m3-button-shape-round)',
      '--m3-button-state': '0%',
      '--m3-button-outline-width': '0px',
      '--m3-button-outline': 'transparent',
      '--m3-button-elevation': 'none',
      '--m3-button-elevation-hover': 'none',

      minWidth: 58,
      minHeight: 'var(--m3-button-height)',
      // The outline sits inside the button, so it takes its width from the padding.
      padding: '0 calc(var(--m3-button-padding) - var(--m3-button-outline-width))',
      gap: 'var(--m3-button-icon-gap)',
      textTransform: 'none',
      color: label,
      backgroundColor: background,
      border: 'var(--m3-button-outline-width) solid var(--m3-button-outline)',
      borderRadius: 'var(--m3-button-shape)',
      boxShadow: 'var(--m3-button-elevation)',
      transition: transition(
        ['border-radius', 'background-color', 'color', 'border-color', 'box-shadow'],
        motion.defaultEffects,
      ),
      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },

      // Touch target: an invisible area of at least minTouchTarget × minTouchTarget px, centered
      // on the button. Taps on it count as taps on the button.
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `max(100%, ${minTouchTarget}px)`,
        height: `max(100%, ${minTouchTarget}px)`,
        transform: 'translate(-50%, -50%)',
      },

      '& .MuiButton-startIcon, & .MuiButton-endIcon': {
        margin: 0,
        '& > *:nth-of-type(1)': { fontSize: 'var(--m3-button-icon-size)' },
      },

      // MUI sets its own colors and shadows on these states; repeat ours so they win.
      '&:hover': { backgroundColor: background, boxShadow: 'var(--m3-button-elevation)' },
      // Only on devices that can hover, so the hover color doesn't stick after a tap.
      '@media (hover: hover)': {
        '&:hover': {
          '--m3-button-state': percent(stateLayer.hover),
          boxShadow: 'var(--m3-button-elevation-hover)',
        },
      },
      '&.Mui-focusVisible': {
        '--m3-button-state': percent(stateLayer.focus),
        backgroundColor: background,
        boxShadow: 'var(--m3-button-elevation)',
        outline: `3px solid ${scheme('secondary')}`,
        outlineOffset: 2,
      },
      // Pressed: the corners tighten (shape morph). The press color is the ripple, see theme.js.
      '&:active': {
        '--m3-button-shape': 'var(--m3-button-shape-pressed)',
        boxShadow: 'var(--m3-button-elevation)',
      },
      '&.Mui-disabled': {
        color: 'var(--m3-button-disabled-label-color)',
        backgroundColor: 'var(--m3-button-disabled-container)',
        borderColor: 'var(--m3-button-outline)',
        boxShadow: 'none',
      },

      variants: [
        ...Object.entries(sizes).map(([size, spec]) => ({
          props: { size },
          style: {
            '--m3-button-height': px(spec.height),
            '--m3-button-padding': px(spec.padding),
            '--m3-button-icon-size': px(spec.iconSize),
            '--m3-button-icon-gap': px(spec.iconGap),
            '--m3-button-size-outline-width': px(spec.outlineWidth),
            '--m3-button-shape-round': px(spec.height / 2),
            '--m3-button-shape-square': px(spec.square),
            '--m3-button-shape-pressed': px(spec.pressed),
            ...typescale(spec.type),
          },
        })),
        {
          props: { shape: 'square' },
          style: { '--m3-button-shape': 'var(--m3-button-shape-square)' },
        },
        ...variants.flatMap((variant) =>
          colors.map((color) => {
            const spec = variantSpec(variant, color);
            return {
              props: { variant, color },
              style: {
                '--m3-button-container': spec.container,
                '--m3-button-label-color': spec.label,
                '--m3-button-disabled-container': spec.disabledContainer,
                '--m3-button-disabled-label-color': spec.disabledLabel,
                ...(spec.outline && {
                  '--m3-button-outline': spec.outline,
                  '--m3-button-outline-width': 'var(--m3-button-size-outline-width)',
                }),
                ...(spec.elevation !== undefined && {
                  '--m3-button-elevation': elevation(spec.elevation),
                  '--m3-button-elevation-hover': elevation(spec.hoverElevation ?? spec.elevation),
                }),
              },
            };
          }),
        ),
      ],
    },
  },
};
