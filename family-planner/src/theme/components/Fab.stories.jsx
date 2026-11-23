import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Fab from '@mui/material/Fab';
import Typography from '@mui/material/Typography';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, waitFor } from 'storybook/test';
import NavigationBar from '../../components/NavigationBar.jsx';
import { elevation, motion, scheme, stateLayer, withOpacity } from '../m3';
import { resolve, rgba } from './storyHelpers';

const fabOf = (canvas, name) => canvas.getByRole('button', { name });

const Row = ({ sx, ...props }) => <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', ...sx }} {...props} />;

const meta = {
  title: 'Components/FAB',
  component: Fab,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          "MUI's `Fab`, styled as the **Material 3 Expressive FAB** (floating action button) by the theme in",
          '`src/theme` (styles: `src/theme/components/fab.js`). Use it like any MUI FAB, from',
          '`@mui/material/Fab`. An icon-only FAB has no text, so give it a name with `aria-label`:',
          '',
          '```jsx',
          '<Fab aria-label="New task or event"><AddIcon /></Fab>',
          '<Fab href="/new" aria-label="New task or event"><AddIcon /></Fab> // a link',
          '<Fab variant="extended"><AddIcon />New task</Fab> // with a label',
          '```',
          '',
          '| `color` | M3 colour |',
          '| --- | --- |',
          '| `primary` (the default) | primary container |',
          '| `secondary` | secondary container |',
          '| `tertiary` | tertiary container |',
          '| any other | looks like primary |',
          '',
          "One size, 56×56px: MUI's `size` has no effect. `variant=\"extended\"` adds a label next to the icon.",
          '',
          "Where a FAB sits on a page is the page's job: on Today it's 16px from the right edge and 16px above",
          'the navigation bar (see **Today placement**).',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** Try the props with the controls below. */
export const Playground = {
  args: { label: 'New task or event', color: 'primary', extended: false, disabled: false },
  argTypes: { color: { control: 'select', options: ['primary', 'secondary', 'tertiary'] } },
  render: ({ label, extended, ...args }) =>
    extended ? (
      <Fab variant="extended" {...args}><AddIcon />{label}</Fab>
    ) : (
      <Fab aria-label={label} {...args}><AddIcon /></Fab>
    ),
};

/** The default colour is primary container. Secondary and tertiary use their containers; any other colour looks like primary. */
export const Colors = {
  render: () => (
    <Row>
      <Fab aria-label="Primary"><AddIcon /></Fab>
      <Fab aria-label="Secondary" color="secondary"><AddIcon /></Fab>
      <Fab aria-label="Tertiary" color="tertiary"><AddIcon /></Fab>
      <Fab aria-label="Other colour" color="error"><AddIcon /></Fab>
    </Row>
  ),
  play: async ({ canvas, canvasElement }) => {
    const c = (value) => rgba(resolve(canvasElement, 'color', value));
    const shadow3 = resolve(canvasElement, 'box-shadow', elevation(3));
    const expected = [
      ['Primary', 'primary-container', 'on-primary-container'],
      ['Secondary', 'secondary-container', 'on-secondary-container'],
      ['Tertiary', 'tertiary-container', 'on-tertiary-container'],
      ['Other colour', 'primary-container', 'on-primary-container'],
    ];
    for (const [name, container, content] of expected) {
      const fab = fabOf(canvas, name);
      const box = fab.getBoundingClientRect();
      const style = getComputedStyle(fab);
      await expect([box.width, box.height]).toEqual([56, 56]);
      await expect(style.borderRadius).toBe('16px');
      await expect(rgba(style.backgroundColor)).toEqual(c(scheme(container)));
      await expect(rgba(style.color)).toEqual(c(scheme(content)));
      await expect(style.boxShadow).toBe(shadow3);
      const icon = fab.querySelector('svg').getBoundingClientRect();
      await expect([icon.width, icon.height]).toEqual([24, 24]);
    }
  },
};

/** One size: MUI's `size` has no effect. An extended FAB adds a label, 56px tall. */
export const Sizes = {
  render: () => (
    <Row sx={{ flexWrap: 'wrap' }}>
      <Fab aria-label="Small" size="small"><AddIcon /></Fab>
      <Fab aria-label="Medium" size="medium"><AddIcon /></Fab>
      <Fab aria-label="Large" size="large"><AddIcon /></Fab>
      <Fab variant="extended"><AddIcon />New task</Fab>
      <Fab variant="extended" size="small"><AddIcon />Small extended</Fab>
      <Fab variant="extended">Save</Fab>
    </Row>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const name of ['Small', 'Medium', 'Large']) {
      const box = fabOf(canvas, name).getBoundingClientRect();
      await expect([box.width, box.height]).toEqual([56, 56]);
    }
    const type = (property) => resolve(canvasElement, property, `var(--material-theme-title-medium-${property})`);
    for (const name of ['New task', 'Small extended', 'Save']) {
      const fab = fabOf(canvas, name);
      const style = getComputedStyle(fab);
      await expect(fab.getBoundingClientRect().height).toBe(56);
      await expect(fab.getBoundingClientRect().width).toBeGreaterThanOrEqual(80);
      await expect(style.borderRadius).toBe('16px');
      await expect([style.paddingLeft, style.paddingRight]).toEqual(['16px', '16px']);
      await expect(style.columnGap).toBe('8px');
      await expect(style.fontSize).toBe(type('font-size'));
      await expect(style.fontWeight).toBe(type('font-weight'));
    }
  },
};

/** M3 FABs have no disabled state; MUI's `disabled` gets M3's usual disabled colours and no shadow. */
export const Disabled = {
  render: () => (
    <Row>
      <Fab aria-label="Disabled" disabled><AddIcon /></Fab>
      <Fab variant="extended" disabled><AddIcon />Disabled extended</Fab>
    </Row>
  ),
  play: async ({ canvas, canvasElement }) => {
    const c = (value) => rgba(resolve(canvasElement, 'color', value));
    for (const name of ['Disabled', 'Disabled extended']) {
      const fab = fabOf(canvas, name);
      const style = getComputedStyle(fab);
      await expect(fab).toBeDisabled();
      await expect(rgba(style.backgroundColor)).toEqual(c(withOpacity(scheme('on-surface'), 0.12)));
      await expect(rgba(style.color)).toEqual(c(withOpacity(scheme('on-surface'), 0.38)));
      await expect(style.boxShadow).toBe('none');
    }
  },
};

/** Inside `data-theme="dark"`, FABs take the dark theme's colours. */
export const DarkTheme = {
  render: () => (
    <Box data-theme="dark" data-testid="dark" sx={{ p: 2, bgcolor: 'background.default' }}>
      <Row>
        <Fab aria-label="Primary"><AddIcon /></Fab>
        <Fab aria-label="Secondary" color="secondary"><AddIcon /></Fab>
      </Row>
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dark = canvas.getByTestId('dark');
    const primary = getComputedStyle(fabOf(canvas, 'Primary'));
    await expect(rgba(primary.backgroundColor)).toEqual(rgba(resolve(dark, 'color', scheme('primary-container'))));
    await expect(rgba(primary.backgroundColor)).not.toEqual(rgba(resolve(canvasElement, 'color', scheme('primary-container'))));
    await expect(rgba(primary.color)).toEqual(rgba(resolve(dark, 'color', scheme('on-primary-container'))));
    const secondary = getComputedStyle(fabOf(canvas, 'Secondary'));
    await expect(rgba(secondary.backgroundColor)).toEqual(rgba(resolve(dark, 'color', scheme('secondary-container'))));
  },
};

/** Tab to a FAB: a focus ring and a 10% state layer. Enter and Space press it. Tab skips a disabled FAB. */
export const KeyboardFocus = {
  args: { onClick: fn() },
  render: (args) => (
    <Row>
      <Fab aria-label="First" onClick={args.onClick}><AddIcon /></Fab>
      <Fab aria-label="Disabled" disabled><AddIcon /></Fab>
      <Fab aria-label="Third" color="secondary"><AddIcon /></Fab>
    </Row>
  ),
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    // Every expected value first: resolve() changes the DOM, which would rerun waitFor forever.
    const c = (value) => rgba(resolve(canvasElement, 'background-color', value));
    const mix = (content, container) =>
      `color-mix(in srgb, ${scheme(content)} ${stateLayer.focus * 100}%, ${scheme(container)})`;
    const firstFocus = c(mix('on-primary-container', 'primary-container'));
    const thirdFocus = c(mix('on-secondary-container', 'secondary-container'));
    const ring = rgba(resolve(canvasElement, 'color', scheme('secondary')));
    const shadow3 = resolve(canvasElement, 'box-shadow', elevation(3));
    await userEvent.tab();
    const first = fabOf(canvas, 'First');
    await expect(first).toHaveFocus();
    const style = getComputedStyle(first);
    await expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual(['solid', '3px', '2px']);
    await expect(rgba(style.outlineColor)).toEqual(ring);
    await waitFor(() => expect(rgba(getComputedStyle(first).backgroundColor)).toEqual(firstFocus));
    await waitFor(() => expect(getComputedStyle(first).boxShadow).toBe(shadow3));
    await expect(first.querySelector('.MuiTouchRipple-ripplePulsate')).toBeNull();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
    await userEvent.tab(); // skips the disabled FAB
    const third = fabOf(canvas, 'Third');
    await expect(third).toHaveFocus();
    await waitFor(() => expect(rgba(getComputedStyle(third).backgroundColor)).toEqual(thirdFocus));
  },
};

/** The shadow and the state layer change with the M3 effects spring; nothing animates under "reduce motion". */
export const Motion = {
  render: () => <Fab aria-label="Motion"><AddIcon /></Fab>,
  play: async ({ canvas }) => {
    const style = getComputedStyle(fabOf(canvas, 'Motion'));
    await expect(style.transitionProperty).toContain('background-color');
    await expect(style.transitionProperty).toContain('box-shadow');
    for (const duration of style.transitionDuration.split(', ')) {
      await expect(duration).toBe(`${motion.defaultEffects.duration / 1000}s`);
    }
    await expect(style.transitionTimingFunction).toContain('linear(');
  },
};

const todayItems = [
  'Sign up Ella for school trip',
  'Pay football membership',
  'School run',
  'Pack football kit',
  'Football practice',
  'Dentist',
  'Buy groceries for the week',
];

/**
 * The "+" as it will sit on the Today page: a link to a new task or event, 16px from the right
 * edge and 16px above the navigation bar, over the list as it scrolls.
 */
export const TodayPlacement = {
  parameters: { layout: 'centered' },
  // A phone-sized window: the navigation bar picks its layout from the window's width, not the
  // frame's, so in a wide window its tabs would overflow the 390px frame.
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => (
    // The transform makes the frame the box that the fixed navigation bar and FAB sit in.
    <Box
      data-testid="phone"
      sx={{ width: 390, height: 844, overflow: 'hidden', transform: 'translateZ(0)', bgcolor: 'background.default' }}
    >
      <Box sx={{ height: '100%', overflowY: 'auto' }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="headlineMedium" component="h1">Today</Typography>
          {todayItems.map((title) => (
            <Card key={title} variant="outlined">
              <CardContent>
                <Typography variant="titleMedium" component="p">{title}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
        <NavigationBar />
        <Fab
          href="#new"
          aria-label="New task or event"
          sx={{ position: 'fixed', right: 16, bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)' }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const fab = canvas.getByRole('link', { name: 'New task or event' });
    fab.scrollIntoView({ block: 'center', inline: 'center' });
    const phone = canvas.getByTestId('phone').getBoundingClientRect();
    const f = fab.getBoundingClientRect();
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' }).getBoundingClientRect();
    await expect(phone.right - f.right).toBeCloseTo(16, 0);
    await expect(nav.top - f.bottom).toBeCloseTo(16, 0);
    await expect([f.width, f.height]).toEqual([56, 56]);
    await expect(rgba(getComputedStyle(fab).backgroundColor)).toEqual(
      rgba(resolve(canvasElement, 'color', scheme('primary-container'))),
    );
    await expect(document.elementFromPoint(f.left + 28, f.top + 28).closest('a')).toBe(fab);
  },
};
