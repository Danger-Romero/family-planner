import Add from '@mui/icons-material/Add';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Event from '@mui/icons-material/Event';
import Button, { type ButtonProps } from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect } from 'storybook/test';
import { minTouchTarget, scheme } from '../m3';

const types = [
  { variant: 'contained', name: 'Filled' },
  { variant: 'tonal', name: 'Tonal' },
  { variant: 'elevated', name: 'Elevated' },
  { variant: 'outlined', name: 'Outlined' },
  { variant: 'text', name: 'Text' },
] as const satisfies { variant: ButtonProps['variant']; name: string }[];

const sizes = [
  { size: 'xsmall', name: 'Extra small', height: 32 },
  { size: 'small', name: 'Small (default)', height: 40 },
  { size: 'medium', name: 'Medium', height: 56 },
  { size: 'large', name: 'Large', height: 96 },
  { size: 'xlarge', name: 'Extra large', height: 136 },
] as const satisfies { size: ButtonProps['size']; name: string; height: number }[];

const colors = ['primary', 'secondary', 'tertiary', 'error'] as const satisfies ButtonProps['color'][];

const icons = { None: undefined, Add: <Add />, Event: <Event />, ArrowForward: <ArrowForward /> };

/** A labelled row in the overview stories. */
function Row({ title, code, children }: { title: string; code?: string; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
      <Stack sx={{ width: 160, flexShrink: 0 }}>
        <Typography variant="titleSmall">{title}</Typography>
        {code && (
          <Typography variant="bodySmall" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
            {code}
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        {children}
      </Stack>
    </Stack>
  );
}

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          "MUI's `Button`, styled as the **Material 3 Expressive** button by the theme in `src/theme`",
          '(styles: `src/theme/components/button.ts`). Use it like any MUI button, from `@mui/material/Button`:',
          '',
          '```jsx',
          '<Button variant="tonal" size="medium" shape="square" startIcon={<Add />}>Add event</Button>',
          '```',
          '',
          '| M3 type | `variant` |',
          '| --- | --- |',
          '| Filled | `contained` |',
          '| Tonal | `tonal` |',
          '| Elevated | `elevated` |',
          '| Outlined | `outlined` |',
          '| Text | `text` |',
          '',
          '`size`: `xsmall`, `small` (default), `medium`, `large`, `xlarge`. `shape`: `round` (default) or `square`.',
          '`color`: `primary` (default, the M3 look), `secondary`, `tertiary`, `error`.',
          '',
          `Touch targets are at least ${minTouchTarget}×${minTouchTarget}px: the extra-small and small`,
          'buttons have an invisible touch area around them (see the *Touch Targets* story).',
        ].join('\n'),
      },
    },
  },
  args: {
    children: 'Label',
    variant: 'contained',
    size: 'small',
    shape: 'round',
    color: 'primary',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: types.map((type) => type.variant) },
    size: { control: 'inline-radio', options: sizes.map((size) => size.size) },
    shape: { control: 'inline-radio', options: ['round', 'square'] },
    color: { control: 'inline-radio', options: colors },
    startIcon: { control: 'select', options: Object.keys(icons), mapping: icons },
    endIcon: { control: 'select', options: Object.keys(icons), mapping: icons },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Try every prop with the controls below. */
export const Playground: Story = {};

/** The five M3 button types, with and without an icon, and disabled. */
export const Types: Story = {
  render: (args) => (
    <Stack spacing={3}>
      {types.map(({ variant, name }) => (
        <Row key={variant} title={name} code={`variant="${variant}"`}>
          <Button {...args} variant={variant}>
            {name}
          </Button>
          <Button {...args} variant={variant} startIcon={<Add />}>
            Add event
          </Button>
          <Button {...args} variant={variant} disabled>
            Disabled
          </Button>
        </Row>
      ))}
    </Stack>
  ),
};

/** The five M3 Expressive sizes, in both shapes. Press and hold a button to see the corners morph. */
export const SizesAndShapes: Story = {
  render: (args) => (
    <Stack spacing={4}>
      {sizes.map(({ size, name, height }) => (
        <Row key={size} title={name} code={`size="${size}" · ${height}px`}>
          <Button {...args} size={size} shape="round" startIcon={<Event />} data-expected-height={height}>
            Round
          </Button>
          <Button {...args} size={size} shape="square" startIcon={<Event />} data-expected-height={height}>
            Square
          </Button>
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    for (const button of canvasElement.querySelectorAll<HTMLElement>('[data-expected-height]')) {
      await expect(button.getBoundingClientRect().height).toBe(Number(button.dataset.expectedHeight));
    }
  },
};

/** Every type in every color. `primary` is the M3 look; the others swap in that color role. */
export const Colors: Story = {
  render: (args) => (
    <Stack spacing={3}>
      {colors.map((color) => (
        <Row key={color} title={color} code={`color="${color}"`}>
          {types.map(({ variant, name }) => (
            <Button key={variant} {...args} variant={variant} color={color}>
              {name}
            </Button>
          ))}
        </Row>
      ))}
    </Stack>
  ),
};

/**
 * The dashed outline shows each button's touch area. Extra-small (32px) and small (40px) buttons
 * have an invisible touch area that reaches the project's minimum of 44×44px.
 */
export const TouchTargets: Story = {
  render: (args) => (
    <Stack
      spacing={2}
      // Vertical padding keeps the touch areas of the first and last rows inside the page.
      sx={{ py: 2, '& .MuiButton-root::after': { outline: `1px dashed ${scheme('error')}` } }}
    >
      {sizes.slice(0, 3).map(({ size, name }) => (
        <Row key={size} title={name} code={`size="${size}"`}>
          <Button {...args} size={size}>
            Save
          </Button>
          <Button {...args} size={size} variant="outlined">
            OK
          </Button>
        </Row>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    // Hit-test just inside the top and bottom edges of the 44px area: the button must get the tap.
    const reach = minTouchTarget / 2 - 1;
    for (const button of canvasElement.querySelectorAll<HTMLElement>('.MuiButton-root')) {
      const box = button.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      await expect(document.elementFromPoint(x, y - reach)).toBe(button);
      await expect(document.elementFromPoint(x, y + reach)).toBe(button);
    }
  },
};
