import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { useArgs } from 'storybook/preview-api';
import { expect, waitFor } from 'storybook/test';
import { scheme, stateLayer, withOpacity } from '../m3';
import { resolve, rgba } from './storyHelpers';

const inputOf = (canvas, name) => canvas.getByRole('switch', { name });
const rootOf = (canvas, name) => inputOf(canvas, name).closest('.MuiSwitch-root');
const partOf = (canvas, name, part) => rootOf(canvas, name).querySelector(`.MuiSwitch-${part}`);

/** A switch named `name` for screen readers (and for the tests). */
const Named = ({ name, ...props }) => <Switch slotProps={{ input: { 'aria-label': name } }} {...props} />;

/** Where the middle of `element` is, from the left of `root`. */
const centerIn = (element, root) => {
  const box = element.getBoundingClientRect();
  return box.left + box.width / 2 - root.getBoundingClientRect().left;
};

const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          "MUI's `Switch`, styled as the **Material 3** switch by the theme in `src/theme` (styles:",
          '`src/theme/components/switch.js`). Use it to turn one setting on or off, like **Mark as',
          'important** and **All day** in the item dialog. Put its label in a `FormControlLabel`, so a tap',
          'on the label toggles it too:',
          '',
          '```jsx',
          '<FormControlLabel label="All day" labelPlacement="start"',
          '  control={<Switch checked={allDay} onChange={(event) => setAllDay(event.target.checked)} />} />',
          '```',
          '',
          '| State | Prop |',
          '| --- | --- |',
          '| On | `checked` |',
          '| Disabled | `disabled` |',
          '',
          'A 52×32px track: off, outlined with a small handle; on, filled with `primary` and a larger',
          'handle at the end. Pressed, the handle grows. It takes up 48px of height, and a tap anywhere in',
          "it toggles. MUI's `size` and `color` props have no effect.",
          '',
          '**Without a visible label**, name it with `slotProps={{ input: { \'aria-label\': \'…\' } }}`.',
          'Screen readers announce it as a switch, on or off.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** Try the props with the controls below. Clicking the switch updates the `checked` control. */
export const Playground = {
  args: { checked: false, disabled: false },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    return (
      <Switch
        {...args}
        onChange={(event) => updateArgs({ checked: event.target.checked })}
        slotProps={{ input: { 'aria-label': 'Playground' } }}
      />
    );
  },
};

/** Off and on, enabled and disabled. Disabled dims the colours, not the whole switch. */
export const States = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <Named name="Off" />
      <Named name="On" defaultChecked />
      <Named name="Off disabled" disabled />
      <Named name="On disabled" defaultChecked disabled />
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const c = (value) => rgba(resolve(canvasElement, 'color', value));
    const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);
    // [name, track, track edge, handle, handle size]
    const expected = [
      ['Off', scheme('surface-container-highest'), scheme('outline'), scheme('outline'), 16],
      ['On', scheme('primary'), 'transparent', scheme('on-primary'), 24],
      ['Off disabled', withOpacity(scheme('surface-container-highest'), 0.12), onSurface(0.12), onSurface(0.38), 16],
      ['On disabled', onSurface(0.12), 'transparent', scheme('surface'), 24],
    ];
    for (const [name, track, edge, handle, size] of expected) {
      const trackStyle = getComputedStyle(partOf(canvas, name, 'track'));
      await expect(rgba(trackStyle.backgroundColor)).toEqual(c(track));
      await expect(trackStyle.opacity).toBe('1');
      await expect(trackStyle.borderTopWidth).toBe('2px');
      await expect(rgba(trackStyle.borderTopColor)).toEqual(c(edge));
      const thumb = partOf(canvas, name, 'thumb');
      await expect(rgba(getComputedStyle(thumb).backgroundColor)).toEqual(c(handle));
      const box = thumb.getBoundingClientRect();
      await expect([box.width, box.height]).toEqual([size, size]);
      await expect(getComputedStyle(rootOf(canvas, name)).opacity).toBe('1');
    }
  },
};

/**
 * The 52×32px track and its handle: in the middle of the left end when off, of the right end when
 * on. The 48px-high touch area covers the whole track and 8px above and below it.
 */
export const Sizes = {
  render: () => (
    <Box sx={{ m: 4 }}>
      <Named name="Size check" />
    </Box>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = inputOf(canvas, 'Size check');
    const root = rootOf(canvas, 'Size check');
    const thumb = partOf(canvas, 'Size check', 'thumb');
    const track = partOf(canvas, 'Size check', 'track').getBoundingClientRect();
    await expect([track.width, track.height]).toEqual([52, 32]);
    await expect(centerIn(thumb, root)).toBe(16);

    const area = input.getBoundingClientRect();
    await expect([area.left, area.top, area.width, area.height]).toEqual([track.left, track.top - 8, 52, 48]);
    // Just inside the top left corner of the touch area, above the track: the tap reaches the input.
    const edge = document.elementFromPoint(area.left + 1, area.top + 1);
    await expect(edge).toBe(input);
    await userEvent.click(edge);
    await expect(input).toBeChecked();

    // The handle slides to the end; the touch area stays over the track.
    await waitFor(() => expect(centerIn(thumb, root)).toBe(36));
    const moved = input.getBoundingClientRect();
    await expect([moved.left, moved.top, moved.width, moved.height]).toEqual([track.left, track.top - 8, 52, 48]);
    await expect(document.elementFromPoint(moved.right - 1, moved.bottom - 1)).toBe(input);
  },
};

/** Click, or press Space, to turn it on and off. */
export const Toggle = {
  render: () => <Named name="Mark as important" />,
  play: async ({ canvas, userEvent }) => {
    const input = inputOf(canvas, 'Mark as important');
    await expect(input).toHaveAttribute('type', 'checkbox');
    await expect(input).toHaveAttribute('role', 'switch');
    await userEvent.click(input);
    await expect(input).toBeChecked();
    await userEvent.keyboard(' ');
    await expect(input).not.toBeChecked();
  },
};

/** With its label at the start of the row, as in the item dialog: a tap on the label toggles it too. */
export const WithALabel = {
  render: () => (
    <FormControlLabel
      label="All day"
      labelPlacement="start"
      control={<Switch />}
      sx={{ display: 'flex', maxWidth: 360, mx: 0, gap: 2, justifyContent: 'space-between' }}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('switch', { name: 'All day' });
    await userEvent.click(canvas.getByText('All day'));
    await expect(input).toBeChecked();
  },
};

/**
 * Tab to a switch with the keyboard: a ring around the track, a 10% state layer around the handle
 * (on-surface when off, primary when on), and no pulsing ripple.
 */
export const KeyboardFocus = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <Named name="Off" />
      <Named name="On" defaultChecked />
    </Stack>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Resolved before waitFor: resolve() changes the DOM, which would rerun waitFor's callback forever.
    const c = (value) => rgba(resolve(canvasElement, 'color', value));
    const ring = c(scheme('secondary'));
    const layers = { Off: c(withOpacity(scheme('on-surface'), stateLayer.focus)), On: c(withOpacity(scheme('primary'), stateLayer.focus)) };
    for (const name of ['Off', 'On']) {
      await userEvent.tab();
      await expect(inputOf(canvas, name)).toHaveFocus();
      const track = getComputedStyle(partOf(canvas, name, 'track'));
      await expect(track.outlineStyle).toBe('solid');
      await expect(track.outlineWidth).toBe('3px');
      await expect(track.outlineOffset).toBe('2px');
      await expect(rgba(track.outlineColor)).toEqual(ring);
      const base = partOf(canvas, name, 'switchBase');
      await waitFor(() => expect(rgba(getComputedStyle(base).backgroundColor)).toEqual(layers[name]));
      await expect(base.querySelector('.MuiTouchRipple-ripplePulsate')).toBeNull();
    }
  },
};

/** Inside a dark theme (`data-theme="dark"`), the switch takes the dark colour roles. */
export const DarkTheme = {
  render: () => (
    <Box data-theme="dark" data-testid="dark" sx={{ p: 2, bgcolor: scheme('surface') }}>
      <Stack direction="row" spacing={3}>
        <Named name="Off" />
        <Named name="On" defaultChecked />
      </Stack>
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dark = canvas.getByTestId('dark');
    const track = getComputedStyle(partOf(canvas, 'On', 'track')).backgroundColor;
    await expect(rgba(track)).toEqual(rgba(resolve(dark, 'color', scheme('primary'))));
    await expect(rgba(track)).not.toEqual(rgba(resolve(canvasElement, 'color', scheme('primary'))));
    const handle = getComputedStyle(partOf(canvas, 'Off', 'thumb')).backgroundColor;
    await expect(rgba(handle)).toEqual(rgba(resolve(dark, 'color', scheme('outline'))));
  },
};
