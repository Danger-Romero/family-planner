import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { expect } from 'storybook/test';
import { elevation, scheme } from '../m3';

/** The computed `property` of `value` (e.g. a var(--…)) as it resolves inside `scope`. */
function resolve(scope, property, value) {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  scope.append(probe);
  const result = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return result;
}

/** The card that contains `text`. */
const cardOf = (canvas, text) => canvas.getByText(text).closest('.MuiCard-root');

/** A card with a header, a line of content and two actions. */
function ExampleCard({ title, ...props }) {
  return (
    <Card {...props}>
      <CardHeader title={title} subheader="Mon 19 October" />
      <CardContent>
        <Typography variant="bodyMedium">Pick up Theo from football at 16:30.</Typography>
      </CardContent>
      <CardActions>
        <Button variant="text">Later</Button>
        <Button variant="text">Open</Button>
      </CardActions>
    </Card>
  );
}

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs', 'ai-generated'],
  parameters: { layout: 'padded' },
};

export default meta;

/** The three M3 card types. MUI's `raised` and numeric `elevation` props don't change the M3 look. */
export const Types = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <ExampleCard title="Elevated" variant="elevation" />
      <ExampleCard title="Filled" variant="filled" />
      <ExampleCard title="Outlined" variant="outlined" />
      <ExampleCard title="Raised" variant="elevation" raised elevation={8} />
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const expected = [
      ['Elevated', 'surface-container-low', 1, '0px'],
      ['Filled', 'surface-container-highest', 0, '0px'],
      ['Outlined', 'surface', 0, '1px'],
      ['Raised', 'surface-container-low', 1, '0px'], // MUI's raised/elevation props change nothing
    ];
    for (const [title, container, level, border] of expected) {
      const style = getComputedStyle(cardOf(canvas, title));
      await expect(style.borderRadius).toBe('12px');
      await expect(style.backgroundColor).toBe(resolve(canvasElement, 'background-color', scheme(container)));
      await expect(style.boxShadow).toBe(resolve(canvasElement, 'box-shadow', elevation(level)));
      await expect(style.borderTopWidth).toBe(border);
    }
    const outlined = getComputedStyle(cardOf(canvas, 'Outlined'));
    await expect(outlined.borderTopColor).toBe(resolve(canvasElement, 'color', scheme('outline-variant')));

    const card = cardOf(canvas, 'Elevated');
    const content = card.querySelector('.MuiCardContent-root');
    await expect(getComputedStyle(content).padding).toBe('16px');
    const title = getComputedStyle(card.querySelector('.MuiCardHeader-title'));
    await expect(title.fontSize).toBe(
      resolve(canvasElement, 'font-size', 'var(--material-theme-title-medium-font-size)'),
    );
    const subheader = getComputedStyle(card.querySelector('.MuiCardHeader-subheader'));
    await expect(subheader.fontSize).toBe(
      resolve(canvasElement, 'font-size', 'var(--material-theme-body-medium-font-size)'),
    );
    await expect(subheader.color).toBe(resolve(canvasElement, 'color', scheme('on-surface-variant')));
    const actions = card.querySelector('.MuiCardActions-root');
    await expect(getComputedStyle(actions).padding).toBe('16px');
    await expect(getComputedStyle(actions).columnGap).toBe('8px');
    await expect(getComputedStyle(actions.children[1]).marginLeft).toBe('0px');
  },
};

/** Urgent items: `color="error"` gives any type a 2px outline in the error color. */
export const Urgent = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <ExampleCard title="Urgent elevated" variant="elevation" color="error" />
      <ExampleCard title="Urgent filled" variant="filled" color="error" />
      <ExampleCard title="Urgent outlined" variant="outlined" color="error" />
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const title of ['Urgent elevated', 'Urgent filled', 'Urgent outlined']) {
      const style = getComputedStyle(cardOf(canvas, title));
      await expect(style.borderTopWidth).toBe('2px');
      await expect(style.borderTopStyle).toBe('solid');
      await expect(style.borderTopColor).toBe(resolve(canvasElement, 'color', scheme('error')));
    }
  },
};

/** Inside a dark theme (`data-theme="dark"`), the cards take the dark color roles. */
export const DarkTheme = {
  render: () => (
    <Box data-theme="dark" data-testid="dark" sx={{ p: 2, bgcolor: 'background.default' }}>
      <Stack spacing={2} sx={{ maxWidth: 360 }}>
        <ExampleCard title="Elevated" variant="elevation" />
        <ExampleCard title="Filled" variant="filled" />
        <ExampleCard title="Outlined" variant="outlined" />
      </Stack>
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dark = canvas.getByTestId('dark');
    for (const [title, container] of [
      ['Elevated', 'surface-container-low'],
      ['Filled', 'surface-container-highest'],
      ['Outlined', 'surface'],
    ]) {
      const background = getComputedStyle(cardOf(canvas, title)).backgroundColor;
      await expect(background).toBe(resolve(dark, 'background-color', scheme(container)));
      await expect(background).not.toBe(resolve(canvasElement, 'background-color', scheme(container)));
    }
  },
};
