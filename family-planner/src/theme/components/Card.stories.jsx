import ChevronRight from '@mui/icons-material/ChevronRight';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Repeat from '@mui/icons-material/Repeat';
import Schedule from '@mui/icons-material/Schedule';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { expect, within } from 'storybook/test';
import { elevation, scheme, typescale } from '../m3';

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

/** A card that is tappable as a whole. `area` goes to the CardActionArea (e.g. `href`, `disabled`). */
function TappableCard({ title, area, ...props }) {
  return (
    <Card {...props}>
      <CardActionArea {...area}>
        <CardContent>
          <Typography variant="titleMedium">{title}</Typography>
          <Typography variant="bodyMedium" sx={{ color: 'text.secondary' }}>
            15:30 – 16:30
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

/** Stand-in for the checkbox, which is a later component. Hidden from screen readers: it's not a control. */
function CheckboxPlaceholder() {
  return (
    <Box
      aria-hidden="true"
      sx={{ width: 18, height: 18, border: `2px solid ${scheme('on-surface-variant')}`, borderRadius: '2px' }}
    />
  );
}

/**
 * Stand-in for the avatar, which is a later component: filled for the responsible person, hollow
 * for people attending.
 */
function AvatarPlaceholder({ name, hollow = false }) {
  return (
    <Box
      role="img"
      aria-label={name}
      sx={{
        width: 28,
        height: 28,
        flex: 'none',
        boxSizing: 'border-box',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: `2px solid ${scheme('primary')}`,
        bgcolor: hollow ? 'transparent' : scheme('primary'),
        color: hollow ? scheme('primary') : scheme('on-primary'),
        ...typescale('label-large'),
      }}
    >
      {name[0]}
    </Box>
  );
}

const RoleLabel = ({ children }) => (
  <Typography variant="labelMedium" sx={{ color: 'text.secondary' }}>
    {children}
  </Typography>
);

/** Start and end time in a 48px column, as on the Today wireframe. */
const Times = ({ start, end }) => (
  <Stack sx={{ width: 48, flex: 'none', alignItems: 'center' }}>
    <Typography variant="titleSmall">{start}</Typography>
    <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
      {end}
    </Typography>
  </Stack>
);

/** A row of the Today list: a fixed-width lead (times or checkbox) and the item's text. */
const Row = ({ children }) => (
  <Stack direction="row" sx={{ gap: 0.5, alignItems: 'flex-start', p: 1.5, pl: 0.5 }}>
    {children}
  </Stack>
);

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          "MUI's `Card`, styled as the **Material 3 Expressive** card by the theme in `src/theme`",
          '(styles: `src/theme/components/card.js`). Use it like any MUI card, from `@mui/material/Card`:',
          '',
          '```jsx',
          '<Card variant="outlined" color="error">',
          '  <CardActionArea href="/items/42">',
          '    <CardContent>…</CardContent>',
          '  </CardActionArea>',
          '</Card>',
          '```',
          '',
          '| M3 type | `variant` |',
          '| --- | --- |',
          '| Elevated | `elevation` (the default) |',
          '| Filled | `filled` |',
          '| Outlined | `outlined` |',
          '',
          '`color="error"` gives any type a 2px outline in the error color, for **urgent** items.',
          "MUI's `raised` and numeric `elevation` props have no effect: the type sets the shadow.",
          '',
          '**Tappable cards:** wrap the content in `CardActionArea` to make the whole card one button,',
          'or pass `href` (or `component={Link}` and `to`) to make it a link. It then gets the M3 hover,',
          'focus, pressed and disabled states.',
          '',
          '**A card with its own buttons or checkbox** keeps them *outside* the `CardActionArea`:',
          'a button inside a button does not work, and screen readers would read it wrong.',
          'The hover, focus and disabled states assume the `CardActionArea` fills the card; next to',
          'other controls they still apply to the whole card, so such a card needs its own design for them.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** Try the props with the controls below. */
export const Playground = {
  args: { variant: 'elevation', color: 'none', tappable: false },
  argTypes: {
    variant: { control: 'select', options: ['elevation', 'filled', 'outlined'] },
    color: { control: 'inline-radio', options: ['none', 'error'], mapping: { none: undefined, error: 'error' } },
    tappable: { control: 'boolean', description: 'Wrap the content in a `CardActionArea` (story only).' },
  },
  render: ({ tappable, ...args }) => {
    const content = (
      <>
        <CardHeader title="Football practice" subheader="Mon, Wed · 15:30 – 16:30" />
        <CardContent>
          <Typography variant="bodyMedium">Theo brings his own water bottle.</Typography>
        </CardContent>
      </>
    );
    return (
      <Card {...args} sx={{ maxWidth: 360 }}>
        {tappable ? <CardActionArea>{content}</CardActionArea> : content}
      </Card>
    );
  },
};

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

/**
 * Tappable cards: the whole card is one button (or one link, with `href` or `component={Link}`).
 * Hover to raise the card one level, press and hold to see the ripple.
 */
export const Tappable = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <TappableCard title="Tap elevated" variant="elevation" />
      <TappableCard title="Tap filled" variant="filled" />
      <TappableCard title="Tap outlined" variant="outlined" />
      <TappableCard title="Football practice" variant="outlined" area={{ href: '#football-practice' }} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const title of ['Tap elevated', 'Tap filled', 'Tap outlined']) {
      const card = cardOf(canvas, title);
      await expect(within(card).getAllByRole('button')).toHaveLength(1);
      const area = card.querySelector('.MuiCardActionArea-root').getBoundingClientRect();
      await expect(area.height).toBeGreaterThanOrEqual(44);
      // Fills the card inside its border (clientWidth is rounded, the box isn't).
      await expect(Math.abs(area.width - card.clientWidth)).toBeLessThanOrEqual(1);
    }
    const link = canvas.getByRole('link', { name: /Football practice/ });
    await expect(link).toHaveAttribute('href', '#football-practice');
  },
};

/** Tab to a card with the keyboard: it shows a focus ring. An urgent card keeps its red outline too. */
export const KeyboardFocus = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <TappableCard title="Tap elevated" variant="elevation" />
      <TappableCard title="Tap urgent" variant="outlined" color="error" />
    </Stack>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.tab();
    const first = cardOf(canvas, 'Tap elevated');
    await expect(first.querySelector('.MuiCardActionArea-root')).toHaveFocus();
    let ring = getComputedStyle(first);
    await expect(ring.outlineStyle).toBe('solid');
    await expect(ring.outlineWidth).toBe('3px');
    await expect(ring.outlineOffset).toBe('2px');
    await expect(ring.outlineColor).toBe(resolve(canvasElement, 'color', scheme('secondary')));

    await userEvent.tab();
    const urgent = cardOf(canvas, 'Tap urgent');
    ring = getComputedStyle(urgent);
    await expect(ring.outlineStyle).toBe('solid');
    await expect(ring.borderTopWidth).toBe('2px');
    await expect(ring.borderTopColor).toBe(resolve(canvasElement, 'color', scheme('error')));
    await expect(getComputedStyle(first).outlineStyle).toBe('none');
  },
};

/**
 * Tappable cards inside another card: only the card whose action area it is reacts. The outer
 * card doesn't fade, get a focus ring or rise.
 */
export const Nested = {
  render: () => (
    <Card variant="outlined" data-testid="outer" sx={{ maxWidth: 360 }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="titleMedium">This week</Typography>
          <TappableCard title="Inner tappable" variant="filled" />
          <TappableCard title="Inner disabled" variant="filled" area={{ disabled: true }} />
        </Stack>
      </CardContent>
    </Card>
  ),
  play: async ({ canvas, userEvent }) => {
    const outer = canvas.getByTestId('outer');
    await expect(getComputedStyle(outer).opacity).toBe('1');
    await userEvent.tab();
    const inner = cardOf(canvas, 'Inner tappable');
    await expect(inner.querySelector('.MuiCardActionArea-root')).toHaveFocus();
    await expect(getComputedStyle(inner).outlineStyle).toBe('solid');
    await expect(getComputedStyle(outer).outlineStyle).toBe('none');
  },
};

/** A disabled tappable card: the card and its content at 38% opacity. */
export const Disabled = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 360 }}>
      <TappableCard title="Tap disabled" variant="elevation" area={{ disabled: true }} />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const card = cardOf(canvas, 'Tap disabled');
    await expect(within(card).getByRole('button')).toBeDisabled();
    await expect(getComputedStyle(card).opacity).toBe('0.38');
  },
};

/**
 * Rows modeled on the Today page, on a 320px phone: an urgent task, an event that opens its
 * details, and a private "Busy" block. The checkbox and avatars are stand-ins until those
 * components exist; the urgent task's checkbox will sit outside any `CardActionArea`.
 */
export const TodayExamples = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  render: () => (
    <Stack spacing={1}>
      <Card variant="outlined" color="error">
        <Row>
          <Box sx={{ width: 48, height: 44, flex: 'none', display: 'grid', placeItems: 'center' }}>
            <CheckboxPlaceholder />
          </Box>
          <Stack sx={{ flex: 1, minWidth: 0, pt: 1.25, gap: 1 }}>
            <Typography variant="titleMedium">
              Sign up Ella for school trip and remember the signed permission slip
            </Typography>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography
                variant="labelLarge"
                sx={{ color: 'error.main', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <Schedule sx={{ fontSize: 16 }} />
                Due in 2 h
              </Typography>
              <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
                12:00
              </Typography>
              <Box sx={{ flex: 1 }} />
              <RoleLabel>Responsible</RoleLabel>
              <AvatarPlaceholder name="Anna" />
            </Stack>
          </Stack>
        </Row>
      </Card>

      <Card variant="outlined">
        <CardActionArea href="#football-practice">
          <Row>
            <Times start="15:30" end="16:30" />
            <Stack sx={{ flex: 1, minWidth: 0, gap: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography variant="titleMedium">Football practice</Typography>
                <Repeat titleAccess="Repeats" sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
                  Mon, Wed
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <RoleLabel>Responsible</RoleLabel>
                <AvatarPlaceholder name="Anna" />
                <Box aria-hidden="true" sx={{ width: '1px', height: 20, mx: 0.5, bgcolor: 'divider' }} />
                <RoleLabel>Attending</RoleLabel>
                <AvatarPlaceholder name="Ella" hollow />
              </Stack>
            </Stack>
            <ChevronRight sx={{ alignSelf: 'center', color: 'text.secondary' }} />
          </Row>
        </CardActionArea>
      </Card>

      <Card
        variant="filled"
        sx={{
          background: `repeating-linear-gradient(135deg, ${scheme('surface-container-highest')} 0 8px, ${scheme('surface-container')} 8px 16px)`,
        }}
      >
        <Row>
          <Times start="17:00" end="18:00" />
          <Stack direction="row" sx={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <LockOutlined sx={{ fontSize: 16 }} />
            <Typography variant="titleMedium">Busy</Typography>
            <Typography variant="bodySmall" sx={{ color: 'text.secondary' }}>
              Jonas · private
            </Typography>
          </Stack>
        </Row>
      </Card>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(600);
    for (const card of canvasElement.querySelectorAll('.MuiCard-root')) {
      await expect(card.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};
