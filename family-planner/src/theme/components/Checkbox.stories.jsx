import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { expect, waitFor } from 'storybook/test';
import { scheme, stateLayer, withOpacity } from '../m3';
import { resolve } from './storyHelpers';

const rootOf = (canvas, name) => canvas.getByRole('checkbox', { name }).closest('.MuiCheckbox-root');
const boxOf = (canvas, name) => rootOf(canvas, name).querySelector('.M3Checkbox-box');
const markOf = (canvas, name, mark) => rootOf(canvas, name).querySelector(`.M3Checkbox-${mark}`);

/** A checkbox named `name` for screen readers (and for the tests). */
const Named = ({ name, ...props }) => <Checkbox slotProps={{ input: { 'aria-label': name } }} {...props} />;

const rows = [
  { row: 'Unticked', props: {} },
  { row: 'Ticked', props: { defaultChecked: true } },
  { row: 'Partly', props: { indeterminate: true } },
];
const columns = [
  { column: 'plain', suffix: '', props: {} },
  { column: 'error', suffix: ' error', props: { color: 'error' } },
  { column: 'disabled', suffix: ' disabled', props: { disabled: true } },
];

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs', 'ai-generated'],
  parameters: { layout: 'padded' },
};

export default meta;

/** Every state: unticked, ticked and partly ticked (`indeterminate`), plain, `color="error"` and disabled. */
export const States = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '120px repeat(3, 80px)', alignItems: 'center', gap: 1 }}>
      <span />
      {columns.map(({ column }) => (
        <Typography key={column} variant="labelLarge">
          {column}
        </Typography>
      ))}
      {rows.map(({ row, props }) => [
        <Typography key={row} variant="labelLarge">
          {row}
        </Typography>,
        ...columns.map(({ suffix, props: columnProps }) => (
          <Box key={row + suffix}>
            <Named name={row + suffix} {...props} {...columnProps} />
          </Box>
        )),
      ])}
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const c = (value) => resolve(canvasElement, 'color', value);
    const on38 = withOpacity(scheme('on-surface'), 0.38);
    // [name, fill, outline color, mark color, shown mark]
    const expected = [
      ['Unticked', 'transparent', scheme('on-surface-variant'), null, null],
      ['Unticked error', 'transparent', scheme('error'), null, null],
      ['Unticked disabled', 'transparent', on38, null, null],
      ['Ticked', scheme('primary'), scheme('primary'), scheme('on-primary'), 'tick'],
      ['Ticked error', scheme('error'), scheme('error'), scheme('on-error'), 'tick'],
      ['Ticked disabled', on38, on38, scheme('surface'), 'tick'],
      ['Partly', scheme('primary'), scheme('primary'), scheme('on-primary'), 'dash'],
      ['Partly error', scheme('error'), scheme('error'), scheme('on-error'), 'dash'],
      ['Partly disabled', on38, on38, scheme('surface'), 'dash'],
    ];
    for (const [name, fill, outline, mark, shown] of expected) {
      const box = getComputedStyle(boxOf(canvas, name));
      await expect(box.backgroundColor).toBe(c(fill));
      await expect(box.borderTopWidth).toBe('2px');
      await expect(box.borderTopColor).toBe(c(outline));
      for (const which of ['tick', 'dash']) {
        const path = getComputedStyle(markOf(canvas, name, which));
        await expect(path.strokeDashoffset).toBe(which === shown ? '0px' : '1px');
        if (which === shown) await expect(path.stroke).toBe(c(mark));
      }
    }
  },
};

/**
 * The 18px box, the 40px state-layer circle and the 48px touch area: a tap anywhere in the touch
 * area toggles. MUI's `size` prop has no effect.
 */
export const Sizes = {
  render: () => (
    <Stack direction="row" spacing={4} sx={{ m: 4 }}>
      <Named name="Size check" />
      <Named name="Small size" size="small" />
    </Stack>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('checkbox', { name: 'Size check' });
    const root = rootOf(canvas, 'Size check');
    const box = boxOf(canvas, 'Size check').getBoundingClientRect();
    await expect([box.width, box.height]).toEqual([18, 18]);
    await expect(getComputedStyle(boxOf(canvas, 'Size check')).borderRadius).toBe('2px');
    const layer = root.getBoundingClientRect();
    await expect([layer.width, layer.height]).toEqual([40, 40]);
    const area = input.getBoundingClientRect();
    await expect([area.width, area.height]).toEqual([48, 48]);
    // Just inside the corner of the 48px area, outside the 40px circle: the tap reaches the input.
    const edge = document.elementFromPoint(area.left + 1, area.top + 1);
    await expect(edge).toBe(input);
    await userEvent.click(edge);
    await expect(input).toBeChecked();

    const small = boxOf(canvas, 'Small size').getBoundingClientRect();
    await expect([small.width, small.height]).toEqual([18, 18]);
    const smallRoot = rootOf(canvas, 'Small size').getBoundingClientRect();
    await expect([smallRoot.width, smallRoot.height]).toEqual([40, 40]);
  },
};

/** Click or press Space to tick and untick. The tick draws itself in and out. */
export const Toggle = {
  render: () => <Named name="Pack football kit" />,
  play: async ({ canvas, userEvent }) => {
    const name = 'Pack football kit';
    const input = canvas.getByRole('checkbox', { name });
    const box = boxOf(canvas, name);
    await userEvent.click(input);
    await expect(input).toBeChecked();
    await expect(boxOf(canvas, name)).toBe(box); // same node: transitions can run
    await waitFor(() => expect(getComputedStyle(markOf(canvas, name, 'tick')).strokeDashoffset).toBe('0px'));
    await userEvent.keyboard(' ');
    await expect(input).not.toBeChecked();
    await waitFor(() => expect(getComputedStyle(markOf(canvas, name, 'tick')).strokeDashoffset).toBe('1px'));
  },
};

/** Inside a dark theme (`data-theme="dark"`), the checkbox takes the dark color roles. */
export const DarkTheme = {
  render: () => (
    <Box data-theme="dark" data-testid="dark" sx={{ p: 2, bgcolor: 'background.default' }}>
      <Named name="Unticked" />
      <Named name="Ticked" defaultChecked />
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dark = canvas.getByTestId('dark');
    const fill = getComputedStyle(boxOf(canvas, 'Ticked')).backgroundColor;
    await expect(fill).toBe(resolve(dark, 'color', scheme('primary')));
    await expect(fill).not.toBe(resolve(canvasElement, 'color', scheme('primary')));
    const outline = getComputedStyle(boxOf(canvas, 'Unticked')).borderTopColor;
    await expect(outline).toBe(resolve(dark, 'color', scheme('on-surface-variant')));
  },
};

/** Tab to a checkbox with the keyboard: a focus ring and a 10% state layer around the box. */
export const KeyboardFocus = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Named name="Unticked" />
      <Named name="Ticked error" color="error" defaultChecked />
    </Stack>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Resolved before waitFor: resolve() changes the DOM, which would rerun waitFor's callback forever.
    const c = (value) => resolve(canvasElement, 'background-color', value);
    const focusLayer = c(withOpacity(scheme('on-surface'), stateLayer.focus));
    const errorFocusLayer = c(withOpacity(scheme('error'), stateLayer.focus));
    await userEvent.tab();
    let root = rootOf(canvas, 'Unticked');
    await expect(canvas.getByRole('checkbox', { name: 'Unticked' })).toHaveFocus();
    let style = getComputedStyle(root);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('3px');
    await expect(style.outlineOffset).toBe('2px');
    await expect(style.outlineColor).toBe(resolve(canvasElement, 'color', scheme('secondary')));
    // The state layer fades in.
    await waitFor(() => expect(getComputedStyle(root).backgroundColor).toBe(focusLayer));
    await userEvent.tab();
    root = rootOf(canvas, 'Ticked error');
    await waitFor(() => expect(getComputedStyle(root).backgroundColor).toBe(errorFocusLayer));
  },
};

/**
 * The press color (MUI's ripple draws in the root's `color`): `primary` on an unticked box,
 * `on-surface` on a ticked one, `error` with `color="error"`. The marks and box animate.
 */
export const PressedColors = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Named name="Unticked" />
      <Named name="Ticked" defaultChecked />
      <Named name="Unticked error" color="error" />
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const c = (value) => resolve(canvasElement, 'color', value);
    await expect(getComputedStyle(rootOf(canvas, 'Unticked')).color).toBe(c(scheme('primary')));
    await expect(getComputedStyle(rootOf(canvas, 'Ticked')).color).toBe(c(scheme('on-surface')));
    await expect(getComputedStyle(rootOf(canvas, 'Unticked error')).color).toBe(c(scheme('error')));
    const tick = getComputedStyle(markOf(canvas, 'Ticked', 'tick'));
    await expect(tick.transitionProperty).toContain('stroke-dashoffset');
    const box = getComputedStyle(boxOf(canvas, 'Ticked'));
    await expect(box.transitionProperty).toContain('background-color');
  },
};
