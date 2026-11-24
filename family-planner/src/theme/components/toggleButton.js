/**
 * MUI ToggleButtonGroup and ToggleButton styled as the Material 3 Expressive connected button
 * group (which replaces M3's segmented button): a row of toggle buttons for picking one option,
 * like Task or Event in the item dialog, or each person's role.
 *
 * ```jsx
 * <ToggleButtonGroup exclusive fullWidth aria-label="Kind" value={kind} onChange={(_, value) => value && setKind(value)}>
 *   <ToggleButton value="task">Task</ToggleButton>
 *   <ToggleButton value="event">Event</ToggleButton>
 * </ToggleButtonGroup>
 * ```
 *
 * | State    | MUI prop                                    |
 * | -------- | ------------------------------------------- |
 * | Off      | not the group's `value`                     |
 * | On       | the group's `value` (`selected` on its own) |
 * | Disabled | `disabled`, on the group or one button      |
 *
 * Each button is 40px high, 2px apart: the ends of the row are round and the corners between
 * buttons are 8px. The button that's on is filled with primary and turns into a pill. MUI's
 * `color` and `size` have no effect.
 *
 * Keyboard (MUI's own): the group is one Tab stop, on the button that's on; the arrow keys move
 * between its buttons, and Space or Enter turns the focused one on.
 *
 * States: hover 8% and focus 10% state layers in the label color, a 3px secondary ring on keyboard
 * focus, and MUI's ripple when pressed, when the inner corners also tighten to 4px. The corners
 * move on the fast spatial spring and the colors fade; nothing moves under "reduce motion". The
 * touch area is at least 44×44px. A long label wraps between words onto a second line; a single
 * long word can't, so three buttons on a narrow phone may need less side padding (the item dialog
 * uses 12px).
 *
 * Values are Google's published M3 values (Jetpack Compose `ButtonGroupSmallTokens` and the
 * `ToggleButton` defaults).
 */
import { corner, minTouchTarget, motion, scheme, stateLayer, transition, typescale, withOpacity } from '../m3';

const percent = (opacity) => `${opacity * 100}%`;
const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);

const labelColor = 'var(--m3-toggle-label-color)';
// The state layer: the label color laid over the container at --m3-toggle-state.
const background = `color-mix(in srgb, ${labelColor} var(--m3-toggle-state), var(--m3-toggle-container))`;
// Start corners (top and bottom) and end corners, so a group can make the inner ones square-ish.
const shape = 'var(--m3-toggle-start) var(--m3-toggle-end) var(--m3-toggle-end) var(--m3-toggle-start)';
const full = 'var(--m3-toggle-outer)';
const inner = 'var(--m3-toggle-inner)';

// ---------------------------------------------------------------------------------------------
// Styles
//
// The state rules only set CSS variables (--m3-toggle-*); the root rule turns them into CSS.
// No CSS property may end in "label" (see button.js).

/** The `MuiToggleButton` entry of the theme's `components` (see theme.js). */
export const toggleButtonOverrides = {
  defaultProps: {
    // M3 shows a focus ring instead of MUI's pulsing focus ripple.
    disableFocusRipple: true,
  },
  styleOverrides: {
    root: {
      '--m3-toggle-container': scheme('surface-container'),
      '--m3-toggle-label-color': scheme('on-surface-variant'),
      '--m3-toggle-state': '0%',
      '--m3-toggle-outer': '20px',
      '--m3-toggle-inner': `${corner.small}px`,
      '--m3-toggle-start': full,
      '--m3-toggle-end': full,

      minHeight: 40,
      padding: '0 16px',
      border: 0,
      borderRadius: shape,
      color: labelColor,
      backgroundColor: background,
      ...typescale('label-large'),
      textTransform: 'none',
      // A long label wraps between words (two lines fit in 40px) instead of widening the row.
      whiteSpace: 'normal',
      transition: [
        transition(['border-radius'], motion.fastSpatial),
        transition(['background-color', 'color'], motion.defaultEffects),
      ].join(', '),
      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },

      // Touch target: at least minTouchTarget × minTouchTarget px, centered on the button.
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `max(100%, ${minTouchTarget}px)`,
        height: `max(100%, ${minTouchTarget}px)`,
        transform: 'translate(-50%, -50%)',
      },

      '&.Mui-selected': {
        '--m3-toggle-container': scheme('primary'),
        '--m3-toggle-label-color': scheme('on-primary'),
      },
      // MUI sets its own colors on these states; repeat ours so they win.
      '&:hover, &.Mui-selected, &.Mui-selected:hover': { color: labelColor, backgroundColor: background },
      // Only on devices that can hover, so the hover color doesn't stick after a tap.
      '@media (hover: hover)': {
        '&:hover': { '--m3-toggle-state': percent(stateLayer.hover) },
      },
      '&.Mui-focusVisible': {
        '--m3-toggle-state': percent(stateLayer.focus),
        outline: `3px solid ${scheme('secondary')}`,
        outlineOffset: 2,
        zIndex: 1,
      },
      // Pressed: the inner corners tighten. The press color is MUI's ripple, scaled in theme.js.
      '&:active': { '--m3-toggle-inner': `${corner.extraSmall}px` },
      '&.Mui-disabled': {
        border: 0,
        '--m3-toggle-container': onSurface(0.1),
        '--m3-toggle-label-color': onSurface(0.38),
      },
      '@media (forced-colors: active)': {
        border: '1px solid ButtonText',
        '&.Mui-selected': { forcedColorAdjust: 'none', backgroundColor: 'Highlight', color: 'HighlightText' },
        '&.Mui-disabled': { borderColor: 'GrayText', color: 'GrayText' },
      },
    },
  },
};

/** The `MuiToggleButtonGroup` entry of the theme's `components` (see theme.js). */
export const toggleButtonGroupOverrides = {
  styleOverrides: {
    root: { gap: 2, borderRadius: 0 },
    // MUI joins grouped buttons with shared borders and square inner corners: undo that, and use
    // our corners instead.
    grouped: {
      margin: 0,
      border: 0,
      borderRadius: shape,
      // The button that's on is a pill.
      '&.Mui-selected': { '--m3-toggle-start': full, '--m3-toggle-end': full },
      '&.Mui-disabled': { border: 0 },
      '@media (forced-colors: active)': { border: '1px solid ButtonText' },
    },
    firstButton: { '--m3-toggle-end': inner },
    middleButton: { '--m3-toggle-start': inner, '--m3-toggle-end': inner },
    lastButton: { '--m3-toggle-start': inner },
  },
};
