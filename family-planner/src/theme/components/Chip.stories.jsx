import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { scheme, stateLayer, withOpacity } from '../m3';
import { resolve, rgba } from './storyHelpers';

/** A filter chip that turns on and off when tapped. */
function ToggleChip({ label, defaultSelected = false, ...props }) {
  const [selected, setSelected] = useState(defaultSelected);
  return <Chip label={label} aria-pressed={selected} onClick={() => setSelected(!selected)} {...props} />;
}
const chipOf = (canvas, name) => canvas.getByRole('button', { name });
const labelOf = (chip) => chip.querySelector('.MuiChip-label');
const checkOf = (chip) => getComputedStyle(chip, '::before');

const Row = ({ sx, ...props }) => <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', ...sx }} {...props} />;

const meta = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs', 'ai-generated'],
  parameters: { layout: 'padded' },
};

export default meta;

/** Off, on, both disabled, and a chip with MUI's `color` and `variant` (which look like Off). */
export const States = {
  render: () => (
    <Row>
      <ToggleChip label="Off" />
      <ToggleChip label="On" defaultSelected />
      <ToggleChip label="Off disabled" disabled />
      <ToggleChip label="On disabled" defaultSelected disabled />
      <ToggleChip label="Coloured" color="primary" variant="outlined" />
    </Row>
  ),
  play: async ({ canvas, canvasElement }) => {
    const c = (value) => rgba(resolve(canvasElement, 'color', value));
    const on12 = withOpacity(scheme('on-surface'), 0.12);
    const on38 = withOpacity(scheme('on-surface'), 0.38);
    // [name, container, outline, label and check colour, check width, check margin, label start]
    const expected = [
      ['Off', 'transparent', scheme('outline-variant'), scheme('on-surface-variant'), '0px', '0px', '15px'],
      ['On', scheme('secondary-container'), 'transparent', scheme('on-secondary-container'), '18px', '7px', '8px'],
      ['Off disabled', 'transparent', on12, on38, '0px', '0px', '15px'],
      ['On disabled', on12, 'transparent', on38, '18px', '7px', '8px'],
      ['Coloured', 'transparent', scheme('outline-variant'), scheme('on-surface-variant'), '0px', '0px', '15px'],
    ];
    for (const [name, container, outline, ink, width, margin, start] of expected) {
      const chip = chipOf(canvas, name);
      const style = getComputedStyle(chip);
      await expect(chip.getBoundingClientRect().height).toBe(32);
      await expect(style.borderRadius).toBe('8px');
      await expect(style.borderTopWidth).toBe('1px');
      await expect(rgba(style.backgroundColor)).toEqual(c(container));
      await expect(rgba(style.borderTopColor)).toEqual(c(outline));
      await expect(rgba(style.color)).toEqual(c(ink));
      await expect(style.opacity).toBe('1');
      await expect(style.fontSize).toBe(resolve(canvasElement, 'font-size', 'var(--material-theme-label-large-font-size)'));
      await expect(style.fontWeight).toBe(resolve(canvasElement, 'font-weight', 'var(--material-theme-label-large-font-weight)'));
      await expect(checkOf(chip).width).toBe(width);
      await expect(checkOf(chip).marginLeft).toBe(margin);
      await expect(rgba(checkOf(chip).backgroundColor)).toEqual(c(ink));
      await expect(getComputedStyle(labelOf(chip)).paddingLeft).toBe(start);
      await expect(getComputedStyle(labelOf(chip)).paddingRight).toBe('15px');
    }
    await expect(chipOf(canvas, 'Off disabled').tabIndex).toBe(-1);
  },
};

/**
 * One size: MUI's `size="small"` is still 32px tall. A clickable chip's touch area is at least
 * 48×48px and it takes up 48px of height; a chip without `onClick` is just a label. A long label
 * ends in "…".
 */
export const Sizes = {
  render: () => (
    <>
      <Row sx={{ m: 4 }}>
        <ToggleChip label="Size check" />
        <ToggleChip label="M" />
        <ToggleChip label="Small" size="small" />
        <Chip label="Static" />
      </Row>
      <Box sx={{ width: 160, mx: 4 }}>
        <ToggleChip label="Ella's football and school things" defaultSelected />
      </Box>
    </>
  ),
  play: async ({ canvas, userEvent }) => {
    const chip = chipOf(canvas, 'Size check');
    const box = chip.getBoundingClientRect();
    const midX = box.left + box.width / 2;
    await expect(getComputedStyle(chip).marginTop).toBe('8px'); // 32 + 2 × 8 = 48px in the layout
    await expect(getComputedStyle(chip).marginBottom).toBe('8px');
    // 7px outside the visible chip, above and below: still the chip.
    await expect(document.elementFromPoint(midX, box.top - 7)).toBe(chip);
    await expect(document.elementFromPoint(midX, box.bottom + 7)).toBe(chip);
    await userEvent.click(document.elementFromPoint(midX, box.top - 7));
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    // A chip narrower than 48px still has a 48px-wide touch area.
    const narrow = chipOf(canvas, 'M');
    const n = narrow.getBoundingClientRect();
    await expect(n.width).toBeLessThan(48);
    await expect(document.elementFromPoint(n.left + n.width / 2 - 23, n.top + 16)).toBe(narrow);
    await expect(document.elementFromPoint(n.left + n.width / 2 + 23, n.top + 16)).toBe(narrow);
    // MUI's size has no effect.
    await expect(chipOf(canvas, 'Small').getBoundingClientRect().height).toBe(32);
    // A chip without onClick: same look, no touch area, not a button.
    const still = canvas.getByText('Static').closest('.MuiChip-root');
    await expect(still.getBoundingClientRect().height).toBe(32);
    await expect(getComputedStyle(still).marginTop).toBe('0px');
    await expect(getComputedStyle(still, '::after').content).toBe('none');
    await expect(canvas.queryByRole('button', { name: 'Static' })).toBeNull();
    // A long label ends in "…" inside its container, and the checkmark stays.
    const long = chipOf(canvas, "Ella's football and school things");
    await expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(160);
    await expect(getComputedStyle(labelOf(long)).textOverflow).toBe('ellipsis');
    await expect(labelOf(long).scrollWidth).toBeGreaterThan(labelOf(long).clientWidth);
    await expect(checkOf(long).width).toBe('18px');
  },
};

/** Chips that wrap onto a second row: each chip's touch area stays its own. */
export const Wrapping = {
  render: () => (
    <Box sx={{ width: 220, display: 'flex', flexWrap: 'wrap', columnGap: 1 }}>
      {['Everyone', "I'm responsible", 'Ella', 'Theo', 'Jonas', 'Anna'].map((name) => (
        <ToggleChip key={name} label={name} />
      ))}
    </Box>
  ),
  play: async ({ canvas }) => {
    const chips = canvas.getAllByRole('button');
    const tops = new Set(chips.map((chip) => chip.getBoundingClientRect().top));
    await expect(tops.size).toBeGreaterThan(1); // the chips wrap
    for (const chip of chips) {
      const box = chip.getBoundingClientRect();
      const midX = box.left + box.width / 2;
      await expect(document.elementFromPoint(midX, box.top - 7)).toBe(chip);
      await expect(document.elementFromPoint(midX, box.bottom + 7)).toBe(chip);
    }
  },
};

/** Inside `data-theme="dark"`, chips take the dark theme's colours. */
export const DarkTheme = {
  render: () => (
    <Box data-theme="dark" data-testid="dark" sx={{ p: 2, bgcolor: 'background.default' }}>
      <Row>
        <ToggleChip label="Off" />
        <ToggleChip label="On" defaultSelected />
      </Row>
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dark = canvas.getByTestId('dark');
    const on = getComputedStyle(chipOf(canvas, 'On'));
    await expect(rgba(on.backgroundColor)).toEqual(rgba(resolve(dark, 'color', scheme('secondary-container'))));
    await expect(rgba(on.backgroundColor)).not.toEqual(rgba(resolve(canvasElement, 'color', scheme('secondary-container'))));
    await expect(rgba(on.color)).toEqual(rgba(resolve(dark, 'color', scheme('on-secondary-container'))));
    const off = getComputedStyle(chipOf(canvas, 'Off'));
    await expect(rgba(off.borderTopColor)).toEqual(rgba(resolve(dark, 'color', scheme('outline-variant'))));
  },
};

/** Turn a chip on and off with the mouse, Space and Enter. */
export const Toggle = {
  render: () => <ToggleChip label="Ella" />,
  play: async ({ canvas, userEvent }) => {
    const chip = chipOf(canvas, 'Ella');
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(checkOf(chip).width).toBe('18px'));
    await expect(chipOf(canvas, 'Ella')).toBe(chip); // same node
    await userEvent.keyboard(' ');
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(checkOf(chip).width).toBe('0px'));
    await userEvent.keyboard('{Enter}');
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  },
};

/** Tab to a chip: a focus ring and a 10% state layer. Tab skips a disabled chip. */
export const KeyboardFocus = {
  render: () => (
    <Row>
      <ToggleChip label="First" />
      <ToggleChip label="Second disabled" disabled />
      <ToggleChip label="Third" defaultSelected />
    </Row>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    // Every expected colour first: resolve() changes the DOM, which would rerun waitFor forever.
    const c = (value) => rgba(resolve(canvasElement, 'background-color', value));
    const offFocus = c(withOpacity(scheme('on-surface-variant'), stateLayer.focus));
    const onFocus = c(
      `color-mix(in srgb, ${scheme('on-secondary-container')} ${stateLayer.focus * 100}%, ${scheme('secondary-container')})`,
    );
    const ring = rgba(resolve(canvasElement, 'color', scheme('secondary')));
    await userEvent.tab();
    let chip = chipOf(canvas, 'First');
    await expect(chip).toHaveFocus();
    const style = getComputedStyle(chip);
    await expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '3px', '2px']);
    await expect(rgba(style.outlineColor)).toEqual(ring);
    await waitFor(() => expect(rgba(getComputedStyle(chip).backgroundColor)).toEqual(offFocus)); // fades in
    await expect(chip.querySelector('.MuiTouchRipple-ripplePulsate')).toBeNull();
    await userEvent.tab(); // skips the disabled chip
    chip = chipOf(canvas, 'Third');
    await expect(chip).toHaveFocus();
    await waitFor(() => expect(rgba(getComputedStyle(chip).backgroundColor)).toEqual(onFocus));
  },
};

/**
 * Turning a chip on, the checkmark grows in and the fill fades in; the label moves over to make
 * room. A chip that starts on doesn't animate.
 */
export const Motion = {
  render: () => <ToggleChip label="On" defaultSelected />,
  play: async ({ canvas }) => {
    await expect(document.getAnimations()).toHaveLength(0); // a chip that starts on doesn't animate
    const chip = chipOf(canvas, 'On');
    await expect(getComputedStyle(chip).transitionProperty).toContain('background-color');
    await expect(getComputedStyle(chip).transitionProperty).toContain('box-shadow');
    await expect(checkOf(chip).transitionProperty).toContain('width');
    await expect(getComputedStyle(labelOf(chip)).transitionProperty).toContain('padding-left');
  },
};
