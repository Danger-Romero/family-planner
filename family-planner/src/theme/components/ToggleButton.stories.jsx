import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { minTouchTarget, scheme, stateLayer, withOpacity } from '../m3';
import { resolve, rgba } from './storyHelpers';

const buttonOf = (canvas, name) => canvas.getByRole('button', { name });
/** The four corner radii of `element`, from the top left, clockwise. */
const corners = (element) => {
  const style = getComputedStyle(element);
  return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
};

/** A connected button group where one option is always picked, like Task or Event. */
function Pick({ label, options, initial = options[0], ...props }) {
  const [value, setValue] = useState(initial);
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      aria-label={label}
      value={value}
      // MUI gives null when the button that's on is tapped again: keep the option instead.
      onChange={(_, next) => next !== null && setValue(next)}
      {...props}
    >
      {options.map((option) => (
        <ToggleButton key={option} value={option}>
          {option}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

const meta = {
  title: 'Components/ToggleButtonGroup',
  component: ToggleButtonGroup,
  subcomponents: { ToggleButton },
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          "MUI's `ToggleButtonGroup` and `ToggleButton`, styled as the **Material 3 Expressive connected",
          "button group** (M3's replacement for the segmented button) by the theme in `src/theme` (styles:",
          '`src/theme/components/toggleButton.js`). Use it to pick one of a few options, like **Task or',
          'Event** and each person\'s role in the item dialog:',
          '',
          '```jsx',
          '<ToggleButtonGroup exclusive fullWidth aria-label="Task or event" value={kind}',
          '  onChange={(_, value) => value && setKind(value)}>',
          '  <ToggleButton value="task">Task</ToggleButton>',
          '  <ToggleButton value="event">Event</ToggleButton>',
          '</ToggleButtonGroup>',
          '```',
          '',
          '| State | Prop |',
          '| --- | --- |',
          '| On | the group\'s `value` |',
          '| Disabled | `disabled`, on the group or one button |',
          '',
          'Buttons are 40px high and 2px apart. The ends of the row are round, the corners between buttons',
          'are 8px, and the button that\'s on is filled with `primary` and becomes a pill. A long label wraps',
          "onto a second line. MUI's `color` and `size` props have no effect.",
          '',
          'Name the group with `aria-label`: screen readers announce each button as pressed or not. The',
          'group is one Tab stop, on the button that\'s on; the arrow keys move between its buttons.',
          'MUI gives `null` when the button that\'s on is tapped again; ignore it when one option must',
          'always be picked.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** Task or Event, as at the top of the item dialog. */
export const Playground = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <Pick label="Task or event" options={['Task', 'Event']} />
    </Box>
  ),
};

/**
 * Off, on and disabled. Tapping the button that's off turns it on and the other one off; tapping
 * the one that's on keeps it on.
 */
export const States = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <Pick label="Kind" options={['Task', 'Event']} />
      <Pick label="Disabled kind" options={['Off disabled', 'On disabled']} initial="On disabled" disabled />
    </Stack>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const c = (value) => rgba(resolve(canvasElement, 'color', value));
    const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);
    // [name, pressed, container, label colour]
    const expected = [
      ['Task', 'true', scheme('primary'), scheme('on-primary')],
      ['Event', 'false', scheme('surface-container'), scheme('on-surface-variant')],
      ['Off disabled', 'false', onSurface(0.1), onSurface(0.38)],
      ['On disabled', 'true', onSurface(0.1), onSurface(0.38)],
    ];
    for (const [name, pressed, container, label] of expected) {
      const button = buttonOf(canvas, name);
      await expect(button).toHaveAttribute('aria-pressed', pressed);
      const style = getComputedStyle(button);
      await expect(rgba(style.backgroundColor)).toEqual(c(container));
      await expect(rgba(style.color)).toEqual(c(label));
      await expect(style.borderTopWidth).toBe('0px');
    }

    // Resolved before waitFor: resolve() changes the DOM, which would rerun waitFor's callback forever.
    const onPrimary = c(scheme('on-primary'));
    await userEvent.click(buttonOf(canvas, 'Event'));
    await expect(buttonOf(canvas, 'Event')).toHaveAttribute('aria-pressed', 'true');
    await expect(buttonOf(canvas, 'Task')).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(rgba(getComputedStyle(buttonOf(canvas, 'Event')).color)).toEqual(onPrimary));
    await userEvent.click(buttonOf(canvas, 'Event'));
    await expect(buttonOf(canvas, 'Event')).toHaveAttribute('aria-pressed', 'true');
  },
};

/**
 * The shape: round ends, 8px corners between buttons, 2px apart, 40px high. The button that's on
 * is a pill. Each button is at least 44×44px to tap.
 */
export const Shape = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <Pick label="Role" options={['Not involved', 'Responsible', 'Attending']} initial="Responsible" />
    </Box>
  ),
  play: async ({ canvas }) => {
    const first = buttonOf(canvas, 'Not involved');
    const middle = buttonOf(canvas, 'Responsible');
    const last = buttonOf(canvas, 'Attending');
    await waitFor(() => expect(corners(first)).toEqual(['20px', '8px', '8px', '20px']));
    await expect(corners(middle)).toEqual(['20px', '20px', '20px', '20px']);
    await expect(corners(last)).toEqual(['8px', '20px', '20px', '8px']);
    const [a, b, c] = [first, middle, last].map((button) => button.getBoundingClientRect());
    await expect([a.height, b.height, c.height]).toEqual([40, 40, 40]);
    await expect(b.left - a.right).toBe(2);
    await expect(c.left - b.right).toBe(2);
    const touch = getComputedStyle(first, '::after');
    await expect(touch.height).toBe(`${minTouchTarget}px`);
    await expect(parseFloat(touch.width)).toBeGreaterThanOrEqual(minTouchTarget);
  },
};

/** With the corners between them square-ish, a middle button that's off has 8px corners on both sides. */
export const MiddleButtonOff = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <Pick label="Role" options={['Not involved', 'Responsible', 'Attending']} />
    </Box>
  ),
  play: async ({ canvas }) => {
    await waitFor(() => expect(corners(buttonOf(canvas, 'Responsible'))).toEqual(['8px', '8px', '8px', '8px']));
    await expect(corners(buttonOf(canvas, 'Not involved'))).toEqual(['20px', '20px', '20px', '20px']);
  },
};

/**
 * A label that doesn't fit wraps between words onto a second line, and the button stays 40px high.
 * A single word can't wrap: where three labels like "Responsible" share a phone-wide row, give the
 * buttons less side padding, as the item dialog does (`sx={{ '& .MuiToggleButton-root': { px: 1.5 } }}`).
 */
export const LongLabels = {
  render: () => (
    <Box sx={{ width: 240 }}>
      <Pick label="Role" options={['Attending', 'Not involved at all']} />
    </Box>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: 'Role' });
    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
    for (const button of within(group).getAllByRole('button')) {
      await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    }
    const long = buttonOf(canvas, 'Not involved at all');
    const text = document.createRange();
    text.selectNodeContents(long.firstChild);
    // One box per line: two lines, broken between words, in the usual 40px.
    await expect(text.getClientRects()).toHaveLength(2);
    await expect(getComputedStyle(long).overflowWrap).toBe('normal');
    await expect(long.getBoundingClientRect().height).toBe(40);
  },
};

/**
 * The group is one Tab stop, on the button that's on (MUI's roving tabindex). The arrow keys move
 * between the buttons; Space or Enter turns the focused one on. A focused button has a 3px ring
 * outside it and a 10% state layer.
 */
export const KeyboardFocus = {
  render: () => (
    <Box sx={{ maxWidth: 360 }}>
      <Pick label="Kind" options={['Task', 'Event']} />
    </Box>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Resolved before waitFor: resolve() changes the DOM, which would rerun waitFor's callback forever.
    const c = (value) => rgba(resolve(canvasElement, 'color', value));
    const focused = c(
      `color-mix(in srgb, ${scheme('on-surface-variant')} ${stateLayer.focus * 100}%, ${scheme('surface-container')})`,
    );
    await userEvent.tab();
    await expect(buttonOf(canvas, 'Task')).toHaveFocus();
    await expect(buttonOf(canvas, 'Event')).toHaveAttribute('tabindex', '-1');
    await userEvent.keyboard('{ArrowRight}');
    const event = buttonOf(canvas, 'Event');
    await expect(event).toHaveFocus();
    await expect(event).toHaveAttribute('aria-pressed', 'false');
    const style = getComputedStyle(event);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('3px');
    await expect(style.outlineOffset).toBe('2px');
    await expect(rgba(style.outlineColor)).toEqual(c(scheme('secondary')));
    await waitFor(() => expect(rgba(getComputedStyle(event).backgroundColor)).toEqual(focused));
    await expect(event.querySelector('.MuiTouchRipple-ripplePulsate')).toBeNull();
    await userEvent.keyboard(' ');
    await expect(event).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Inside a dark theme (`data-theme="dark"`), the buttons take the dark colour roles. */
export const DarkTheme = {
  render: () => (
    <Box data-theme="dark" data-testid="dark" sx={{ p: 2, maxWidth: 360, bgcolor: scheme('surface') }}>
      <Pick label="Kind" options={['Task', 'Event']} />
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dark = canvas.getByTestId('dark');
    const on = rgba(getComputedStyle(buttonOf(canvas, 'Task')).backgroundColor);
    await expect(on).toEqual(rgba(resolve(dark, 'color', scheme('primary'))));
    await expect(on).not.toEqual(rgba(resolve(canvasElement, 'color', scheme('primary'))));
    const off = rgba(getComputedStyle(buttonOf(canvas, 'Event')).backgroundColor);
    await expect(off).toEqual(rgba(resolve(dark, 'color', scheme('surface-container'))));
  },
};
