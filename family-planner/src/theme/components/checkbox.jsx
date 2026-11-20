/**
 * MUI Checkbox styled as the Material 3 Expressive checkbox.
 *
 * | State        | MUI prop        |
 * | ------------ | --------------- |
 * | Ticked       | `checked`       |
 * | Partly ticked| `indeterminate` |
 * | Error        | `color="error"` |
 * | Disabled     | `disabled`      |
 *
 * The theme gives every Checkbox our own icon (`CheckboxIcon.jsx`): an 18px box that draws a tick or
 * a dash. MUI's `size` prop has no effect (M3 has one size). The state-layer circle is 40px and
 * the touch area 48px: a tap anywhere in it toggles. The checkbox takes up the whole 48×48px
 * (4px margin around the circle), so a neighbour never sits under its touch area.
 *
 * States: hover 8% and focus 10% state layers on the circle (on-surface when unticked, primary
 * when ticked, error with `color="error"`), a 3px secondary focus ring, and MUI's ripple when
 * pressed (primary when unticked, on-surface when ticked). The tick draws itself in and out, and
 * nothing animates under "reduce motion".
 *
 * Without a visible label, name the checkbox for screen readers:
 * `<Checkbox slotProps={{ input: { 'aria-label': 'Mark as done: Pack football kit' } }} />`.
 *
 * Values are Google's published M3 values (Jetpack Compose `CheckboxTokens`).
 */
import { motion, scheme, stateLayer, transition, withOpacity } from '../m3';
import CheckboxIcon from './CheckboxIcon';

const noMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };
const percent = (opacity) => `${opacity * 100}%`;
// The state layer: its color at --m3-checkbox-state over nothing.
const stateBackground =
  'color-mix(in srgb, var(--m3-checkbox-state-color) var(--m3-checkbox-state), transparent)';

const box = '& .M3Checkbox-box';
const tick = '& .M3Checkbox-tick';
const dash = '& .M3Checkbox-dash';
const onSurface38 = withOpacity(scheme('on-surface'), 0.38);

// ---------------------------------------------------------------------------------------------
// Styles
//
// The color rules only set CSS variables (--m3-checkbox-*); the box and mark rules use them.
// No CSS property may end in "label" (see button.js).

/** The `MuiCheckbox` entry of the theme's `components` (see theme.js). */
export const checkboxOverrides = {
  defaultProps: {
    icon: <CheckboxIcon />,
    checkedIcon: <CheckboxIcon />,
    indeterminateIcon: <CheckboxIcon />,
    // M3 shows a focus ring and a 10% state layer instead of MUI's pulsing focus ripple.
    disableFocusRipple: true,
  },
  styleOverrides: {
    root: {
      // Outline when unticked; fill (and outline) when ticked; the tick or dash on the fill.
      '--m3-checkbox-outline': scheme('on-surface-variant'),
      '--m3-checkbox-fill': scheme('primary'),
      '--m3-checkbox-mark': scheme('on-primary'),
      // The hover and focus state layer, and (as `color`) the pressed color: MUI's ripple draws
      // in currentColor.
      '--m3-checkbox-state-color': scheme('on-surface'),
      '--m3-checkbox-state': '0%',
      color: scheme('primary'),

      // The 40px state-layer circle around the 18px box, and 4px around it for the touch area,
      // so a neighbour can't sit under it (as Compose's minimumInteractiveComponentSize).
      padding: 11,
      margin: 4,
      borderRadius: '50%',
      backgroundColor: stateBackground,
      transition: transition(['background-color'], motion.defaultEffects),
      ...noMotion,

      // MUI sets its own hover color; repeat ours so it wins.
      '&:hover': { backgroundColor: stateBackground },
      // Only on devices that can hover, so the hover color doesn't stick after a tap.
      '@media (hover: hover)': {
        '&:hover': { '--m3-checkbox-state': percent(stateLayer.hover) },
      },
      '&.Mui-focusVisible': {
        '--m3-checkbox-state': percent(stateLayer.focus),
        outline: `3px solid ${scheme('secondary')}`,
        outlineOffset: 2,
      },

      // The touch area: MUI's hidden input, which takes the taps, grows to 48px around the circle.
      '& > input': {
        width: 48,
        height: 48,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },

      [box]: {
        position: 'relative',
        display: 'block',
        boxSizing: 'border-box',
        width: 18,
        height: 18,
        borderRadius: 2,
        border: '2px solid var(--m3-checkbox-outline)',
        backgroundColor: 'transparent',
        // The disabled colors are see-through: a fill under the border would darken its rim.
        backgroundClip: 'padding-box',
        transition: transition(['background-color', 'border-color'], motion.defaultEffects),
        ...noMotion,
        '& svg': { position: 'absolute', inset: -2, width: 18, height: 18 },
      },
      [`${tick}, ${dash}`]: {
        fill: 'none',
        stroke: 'var(--m3-checkbox-mark)',
        strokeWidth: 2,
        // A mark is one dash of the path's length (pathLength="1"), moved off the path to hide it.
        // The gap is longer than the path, so a hidden mark leaves no dot at its end.
        strokeDasharray: '1 2',
        strokeDashoffset: 1,
        // The tick draws itself in and out.
        transition: transition(['stroke-dashoffset'], motion.fastEffects),
        ...noMotion,
      },

      '&.Mui-checked, &.MuiCheckbox-indeterminate': {
        '--m3-checkbox-state-color': 'var(--m3-checkbox-fill)',
        color: scheme('on-surface'),
        [box]: { borderColor: 'var(--m3-checkbox-fill)', backgroundColor: 'var(--m3-checkbox-fill)' },
      },
      '&.Mui-checked': { [tick]: { strokeDashoffset: 0 } },
      // Partly ticked wins over ticked.
      '&.MuiCheckbox-indeterminate': {
        [tick]: { strokeDashoffset: 1 },
        [dash]: { strokeDashoffset: 0 },
      },

      '&.Mui-disabled': {
        '--m3-checkbox-outline': onSurface38,
        '--m3-checkbox-fill': onSurface38,
        '--m3-checkbox-mark': scheme('surface'),
        '--m3-checkbox-state': '0%',
      },

      // Windows High Contrast forces the box to the page colors but not an SVG's stroke, so a
      // white tick would vanish on the forced white box. Draw the marks in the system text color.
      '@media (forced-colors: active)': {
        [`${tick}, ${dash}`]: { stroke: 'CanvasText' },
        '&.Mui-disabled': { [box]: { borderColor: 'GrayText' }, [`${tick}, ${dash}`]: { stroke: 'GrayText' } },
      },

      variants: [
        {
          props: { color: 'error' },
          style: {
            '--m3-checkbox-outline': scheme('error'),
            '--m3-checkbox-fill': scheme('error'),
            '--m3-checkbox-mark': scheme('on-error'),
            // Every state layer and the press color are error, ticked or not.
            '&, &.Mui-checked, &.MuiCheckbox-indeterminate': {
              '--m3-checkbox-state-color': scheme('error'),
              color: scheme('error'),
            },
          },
        },
      ],
    },
  },
};
