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
 * the touch area 48px: a tap anywhere in it toggles.
 *
 * Without a visible label, name the checkbox for screen readers:
 * `<Checkbox slotProps={{ input: { 'aria-label': 'Mark as done: Pack football kit' } }} />`.
 *
 * Values are Google's published M3 values (Jetpack Compose `CheckboxTokens`).
 */
import { scheme, withOpacity } from '../m3';
import CheckboxIcon from './CheckboxIcon';

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
  },
  styleOverrides: {
    root: {
      // Outline when unticked; fill (and outline) when ticked; the tick or dash on the fill.
      '--m3-checkbox-outline': scheme('on-surface-variant'),
      '--m3-checkbox-fill': scheme('primary'),
      '--m3-checkbox-mark': scheme('on-primary'),

      // The 40px state-layer circle around the 18px box.
      padding: 11,
      borderRadius: '50%',

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
      },

      '&.Mui-checked, &.MuiCheckbox-indeterminate': {
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
      },

      variants: [
        {
          props: { color: 'error' },
          style: {
            '--m3-checkbox-outline': scheme('error'),
            '--m3-checkbox-fill': scheme('error'),
            '--m3-checkbox-mark': scheme('on-error'),
          },
        },
      ],
    },
  },
};
