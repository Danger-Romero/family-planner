/**
 * MUI Switch styled as the Material 3 switch: on or off for one setting, like "Mark as important"
 * and "All day" in the item dialog.
 *
 * | State    | MUI prop   |
 * | -------- | ---------- |
 * | Off      | `checked={false}` |
 * | On       | `checked`  |
 * | Disabled | `disabled` |
 *
 * `<FormControlLabel label="All day" labelPlacement="start" control={<Switch checked={allDay} … />} />`
 *
 * A 52×32px track with a round handle: off, an outlined track and a small 16px handle in the
 * outline color; on, a primary track and a 24px handle that slides to the end. Pressed, the handle
 * grows to 28px. MUI's `size` and `color` have no effect (M3 has one size and one look).
 *
 * States: hover 8% and focus 10% state layers in a 40px circle around the handle (on-surface when
 * off, primary when on), the handle in a stronger color on hover, a 3px secondary ring around
 * the track on keyboard focus, and MUI's ripple when pressed. The switch takes up 48px of height
 * (8px above and below the track), and a tap anywhere in that height toggles it.
 * The handle moves and grows on the fast spatial spring; nothing moves under "reduce motion".
 * In Windows High Contrast, the track and handle are drawn in the system colors.
 *
 * Values are Google's published M3 values (Jetpack Compose `SwitchTokens`).
 */
import { motion, scheme, stateLayer, transition, withOpacity } from '../m3';

const percent = (opacity) => `${opacity * 100}%`;
const noMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };
const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);

// The state layer: its color at --m3-switch-state over nothing.
const stateBackground = 'color-mix(in srgb, var(--m3-switch-state-color) var(--m3-switch-state), transparent)';

const checked = '&:has(> .Mui-checked)';
const disabled = '&:has(> .Mui-disabled)';

// ---------------------------------------------------------------------------------------------
// Styles
//
// The root sets CSS variables (--m3-switch-*) for each state; the parts (track, handle, state
// layer) only read them. No CSS property may end in "label" (see button.js).

/** The `MuiSwitch` entry of the theme's `components` (see theme.js). */
export const switchOverrides = {
  defaultProps: {
    // M3 shows a focus ring instead of MUI's pulsing focus ripple.
    disableFocusRipple: true,
  },
  styleOverrides: {
    root: {
      '--m3-switch-track': scheme('surface-container-highest'),
      '--m3-switch-outline': scheme('outline'),
      '--m3-switch-handle': scheme('outline'),
      '--m3-switch-handle-size': '16px',
      '--m3-switch-state-color': scheme('on-surface'),
      '--m3-switch-state': '0%',
      // How far the handle has moved along the track.
      '--m3-switch-shift': '0px',

      width: 52,
      height: 32,
      padding: 0,
      // 32 + 2 × 8 = 48px of height, the touch area.
      marginBlock: 8,
      overflow: 'visible',

      [checked]: {
        '--m3-switch-track': scheme('primary'),
        '--m3-switch-outline': 'transparent',
        '--m3-switch-handle': scheme('on-primary'),
        '--m3-switch-handle-size': '24px',
        '--m3-switch-state-color': scheme('primary'),
        '--m3-switch-shift': '20px',
      },

      // Only on devices that can hover, so the hover color doesn't stick after a tap.
      '@media (hover: hover)': {
        '&:hover': {
          '--m3-switch-state': percent(stateLayer.hover),
          '--m3-switch-handle': scheme('on-surface-variant'),
        },
        [`${checked}:hover`]: { '--m3-switch-handle': scheme('primary-container') },
      },
      '&:has(> .Mui-focusVisible)': {
        '--m3-switch-state': percent(stateLayer.focus),
        '--m3-switch-handle': scheme('on-surface-variant'),
      },
      [`${checked}:has(> .Mui-focusVisible)`]: { '--m3-switch-handle': scheme('primary-container') },
      // Pressed: the handle grows. The press color is MUI's ripple, scaled to 10% in theme.js.
      '&:has(> .MuiSwitch-switchBase:active)': {
        '--m3-switch-handle-size': '28px',
        '--m3-switch-handle': scheme('on-surface-variant'),
      },
      [`${checked}:has(> .MuiSwitch-switchBase:active)`]: { '--m3-switch-handle': scheme('primary-container') },

      // M3 dims the colors, not the whole switch.
      [disabled]: {
        '--m3-switch-track': withOpacity(scheme('surface-container-highest'), 0.12),
        '--m3-switch-outline': onSurface(0.12),
        '--m3-switch-handle': onSurface(0.38),
        '--m3-switch-state': '0%',
        '--m3-switch-handle-size': '16px',
      },
      [`${checked}${disabled.slice(1)}`]: {
        '--m3-switch-track': onSurface(0.12),
        '--m3-switch-outline': 'transparent',
        '--m3-switch-handle': scheme('surface'),
        '--m3-switch-handle-size': '24px',
      },

      // Windows High Contrast would paint the track and handle in the page color: draw them in the
      // system colors instead, the handle filled.
      '@media (forced-colors: active)': {
        '& .MuiSwitch-track': { forcedColorAdjust: 'none', backgroundColor: 'Canvas', borderColor: 'CanvasText' },
        '& .MuiSwitch-thumb': { forcedColorAdjust: 'none', backgroundColor: 'CanvasText' },
        [`${checked} .MuiSwitch-track`]: { backgroundColor: 'Highlight', borderColor: 'Highlight' },
        [`${checked} .MuiSwitch-thumb`]: { backgroundColor: 'HighlightText' },
        [`${disabled} .MuiSwitch-track`]: { borderColor: 'GrayText' },
        [`${disabled} .MuiSwitch-thumb`]: { backgroundColor: 'GrayText' },
      },
    },

    // The 40px state layer around the handle. It moves with the handle (20px when on).
    switchBase: {
      top: -4,
      left: -4,
      width: 40,
      height: 40,
      padding: 0,
      borderRadius: '50%',
      color: 'inherit',
      backgroundColor: stateBackground,
      transform: 'translateX(var(--m3-switch-shift))',
      transition: transition(['transform'], motion.fastSpatial),
      ...noMotion,
      '&.Mui-checked': { transform: 'translateX(var(--m3-switch-shift))' },
      // MUI sets its own colors on these states; repeat ours so they win.
      '&:hover, &.Mui-checked:hover': { backgroundColor: stateBackground },
      '&.Mui-checked + .MuiSwitch-track, &.Mui-disabled + .MuiSwitch-track': {
        backgroundColor: 'var(--m3-switch-track)',
        opacity: 1,
      },
      '&.Mui-focusVisible + .MuiSwitch-track': {
        outline: `3px solid ${scheme('secondary')}`,
        outlineOffset: 2,
      },
    },
    // The real checkbox: over the whole track and 8px above and below it, the 48px touch area.
    // It sits in the state layer, which moves with the handle, so it moves back by as much.
    input: {
      top: -4,
      left: 'calc(4px - var(--m3-switch-shift))',
      width: 52,
      height: 48,
    },
    thumb: {
      width: 'var(--m3-switch-handle-size)',
      height: 'var(--m3-switch-handle-size)',
      border: 0,
      boxShadow: 'none',
      backgroundColor: 'var(--m3-switch-handle)',
      transition: [
        transition(['width', 'height'], motion.fastSpatial),
        transition(['background-color'], motion.defaultEffects),
      ].join(', '),
      ...noMotion,
    },
    track: {
      boxSizing: 'border-box',
      borderRadius: 16,
      border: '2px solid var(--m3-switch-outline)',
      backgroundColor: 'var(--m3-switch-track)',
      opacity: 1,
      transition: transition(['background-color', 'border-color'], motion.defaultEffects),
      ...noMotion,
    },
  },
};
