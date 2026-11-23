import Pets from '@mui/icons-material/Pets';
import Star from '@mui/icons-material/Star';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { expect, within } from 'storybook/test';
import Member from '../../components/Member.jsx';
import MemberAvatar from '../../components/MemberAvatar.jsx';
import { avatarIcons } from '../../services/avatars.js';
import { scheme } from '../m3';
import { resolve, rgba } from './storyHelpers';

const avatarOf = (canvas, name) => canvas.getByRole('img', { name });

const Row = ({ sx, ...props }) => <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', ...sx }} {...props} />;

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          "MUI's `Avatar`, styled by the theme in `src/theme` (styles: `src/theme/components/avatar.js`).",
          'It shows who a task or event belongs to: **filled for the person responsible**, **outlined for',
          'people attending**. One colour for everyone; people are told apart by their initial or icon.',
          '',
          '```jsx',
          '<Avatar role="img" aria-label="Anna">A</Avatar> // responsible',
          '<Avatar variant="outlined" role="img" aria-label="Ella">E</Avatar> // attending',
          '```',
          '',
          'For a family member, use `MemberAvatar` (`src/components/MemberAvatar.jsx`): it picks their icon',
          'or initial and names the avatar after them.',
          '',
          'Filled vs outlined is only visible, so always give an avatar `role="img"` and an `aria-label` with',
          'the person\'s name, plus the role ("Anna, responsible") when no "Responsible" / "Attending" label',
          'is shown next to it.',
          '',
          'One size, 28×28px, always round. An icon is 18px.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** Try the props with the controls below. */
export const Playground = {
  args: { variant: 'circular', children: 'A', 'aria-label': 'Anna', role: 'img' },
  argTypes: { variant: { control: 'select', options: ['circular', 'outlined'] } },
};

/** The two roles, with an initial and with an icon. */
const roles = (
  <Row>
    <Avatar role="img" aria-label="Anna">A</Avatar>
    <Avatar role="img" aria-label="Ella" variant="outlined">E</Avatar>
    <Avatar role="img" aria-label="Theo"><Pets /></Avatar>
    <Avatar role="img" aria-label="Jonas" variant="outlined"><Star /></Avatar>
  </Row>
);

/** Checks the avatars in `roles` against the colours as they resolve inside `scope`. */
async function checkRoles(canvas, scope) {
  const c = (role) => rgba(resolve(scope, 'color', scheme(role)));
  const type = (property) => resolve(scope, property, `var(--material-theme-label-large-${property})`);
  for (const [name, outlined, icon] of [
    ['Anna', false, false],
    ['Ella', true, false],
    ['Theo', false, true],
    ['Jonas', true, true],
  ]) {
    const avatar = avatarOf(canvas, name);
    const style = getComputedStyle(avatar);
    const box = avatar.getBoundingClientRect();
    await expect([box.width, box.height]).toEqual([28, 28]);
    await expect(style.borderRadius).toBe('50%');
    await expect(style.boxSizing).toBe('border-box');
    await expect(style.borderTopWidth).toBe('2px');
    await expect(style.borderTopStyle).toBe('solid');
    await expect(rgba(style.borderTopColor)).toEqual(c('primary'));
    // Printed as on screen, even with the browser's "background graphics" off.
    await expect(style.getPropertyValue('print-color-adjust')).toBe('exact');
    if (outlined) {
      await expect(rgba(style.backgroundColor)[3]).toBe(0);
      await expect(rgba(style.color)).toEqual(c('primary'));
    } else {
      await expect(rgba(style.backgroundColor)).toEqual(c('primary'));
      await expect(rgba(style.color)).toEqual(c('on-primary'));
    }
    if (icon) {
      const svg = avatar.querySelector('svg');
      const size = svg.getBoundingClientRect();
      await expect([size.width, size.height]).toEqual([18, 18]);
      await expect(rgba(getComputedStyle(svg).fill)).toEqual(rgba(style.color));
    } else {
      await expect(style.fontSize).toBe(type('font-size'));
      await expect(style.fontWeight).toBe(type('font-weight'));
      await expect(style.lineHeight).toBe(type('line-height'));
    }
  }
}

/**
 * Filled for the person responsible, outlined for people attending, with an initial or an icon.
 * The outlined one has no fill, so the card behind it shows through.
 */
export const Roles = {
  render: () => roles,
  play: async ({ canvas, canvasElement }) => checkRoles(canvas, canvasElement),
};

/** Avatars are always round: MUI's `rounded` and `square` look like the default. */
export const Shapes = {
  render: () => (
    <Row>
      <Avatar role="img" aria-label="Rounded" variant="rounded">R</Avatar>
      <Avatar role="img" aria-label="Square" variant="square">S</Avatar>
    </Row>
  ),
  play: async ({ canvas, canvasElement }) => {
    const c = (role) => rgba(resolve(canvasElement, 'color', scheme(role)));
    for (const name of ['Rounded', 'Square']) {
      const style = getComputedStyle(avatarOf(canvas, name));
      await expect(style.borderRadius).toBe('50%');
      await expect(rgba(style.backgroundColor)).toEqual(c('primary'));
      await expect(rgba(style.color)).toEqual(c('on-primary'));
    }
  },
};

/** The same roles in the dark theme. */
export const DarkTheme = {
  render: () => (
    <Box data-theme="dark" data-testid="dark" sx={{ p: 2, bgcolor: scheme('surface') }}>
      {roles}
    </Box>
  ),
  play: async ({ canvas }) => checkRoles(canvas, canvas.getByTestId('dark')),
};

/**
 * `MemberAvatar` turns a family member into their avatar: their icon, or the first letter of their
 * name when they have none (or an icon name the app doesn't know). It's named after the person;
 * `label` replaces the name, e.g. when no role label is shown next to it.
 */
export const FromMember = {
  render: () => (
    <Stack sx={{ gap: 2 }}>
      <Row>
        <MemberAvatar member={{ name: 'Anna' }} />
        <MemberAvatar member={{ name: 'ella', avatarIcon: 'star' }} variant="outlined" />
        <MemberAvatar member={{ name: 'Jonas', avatarIcon: 'dragon' }} />
        <MemberAvatar member={{ name: 'Theo', avatarIcon: 'toString' }} />
        <MemberAvatar member={{ name: 'Anna' }} label="Anna, responsible" />
      </Row>
      <Row data-testid="all-icons" sx={{ flexWrap: 'wrap' }}>
        {avatarIcons.map((icon) => (
          <MemberAvatar key={icon.name} member={{ name: 'X', avatarIcon: icon.name }} label={icon.label} />
        ))}
      </Row>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(avatarOf(canvas, 'Anna')).toHaveTextContent(/^A$/);
    const ella = avatarOf(canvas, 'ella');
    await expect(ella.querySelector('svg')).not.toBeNull();
    await expect(ella).toHaveTextContent(/^$/);
    await expect(ella).toHaveClass('MuiAvatar-outlined');
    // Icon names the app doesn't know show the initial.
    await expect(avatarOf(canvas, 'Jonas')).toHaveTextContent(/^J$/);
    await expect(avatarOf(canvas, 'Theo')).toHaveTextContent(/^T$/);
    await expect(avatarOf(canvas, 'Anna, responsible')).toHaveTextContent(/^A$/);
    const all = within(canvas.getByTestId('all-icons'));
    for (const icon of avatarIcons) {
      await expect(avatarOf(all, icon.label).querySelector('svg')).not.toBeNull();
    }
  },
};

const RoleLabel = ({ children }) => (
  <Typography variant="labelMedium" sx={{ color: 'text.secondary' }}>
    {children}
  </Typography>
);

/** On a Today card: one person responsible, two attending, next to the role labels. */
export const TodayCard = {
  render: () => (
    <Card variant="outlined" sx={{ maxWidth: 360 }}>
      <CardContent>
        <Stack sx={{ gap: 1 }}>
          <Typography variant="titleMedium">Football practice</Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <RoleLabel>Responsible</RoleLabel>
            <MemberAvatar member={{ name: 'Anna' }} />
            <Box aria-hidden="true" sx={{ width: '1px', height: 20, mx: 0.5, bgcolor: 'divider' }} />
            <RoleLabel>Attending</RoleLabel>
            <MemberAvatar member={{ name: 'Ella', avatarIcon: 'star' }} variant="outlined" />
            <MemberAvatar member={{ name: 'Theo' }} variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  ),
  play: async ({ canvas, canvasElement }) => {
    const primary = rgba(resolve(canvasElement, 'color', scheme('primary')));
    await expect(rgba(getComputedStyle(avatarOf(canvas, 'Anna')).backgroundColor)).toEqual(primary);
    for (const name of ['Ella', 'Theo']) {
      await expect(rgba(getComputedStyle(avatarOf(canvas, name)).backgroundColor)[3]).toBe(0);
    }
    await expect(avatarOf(canvas, 'Ella').querySelector('svg')).not.toBeNull();
    await expect(avatarOf(canvas, 'Theo')).toHaveTextContent(/^T$/);
  },
};

/** The members list on the Family page: each member's avatar before their name. */
export const MembersList = {
  render: () => (
    <ul>
      <Member member={{ id: '1', name: 'Anna', memberType: 'adult', user: 'u1', avatarIcon: 'sun' }} />
      <Member member={{ id: '2', name: 'Theo', memberType: 'child', user: null, avatarIcon: null }} />
    </ul>
  ),
  play: async ({ canvas }) => {
    const [anna, theo] = canvas.getAllByRole('listitem');
    // Still list items (bullets, and a list for screen readers in every browser).
    for (const item of [anna, theo]) await expect(getComputedStyle(item).display).toBe('list-item');
    const annaAvatar = anna.querySelector('.MuiAvatar-root');
    const theoAvatar = theo.querySelector('.MuiAvatar-root');
    await expect(annaAvatar.querySelector('svg')).not.toBeNull();
    await expect(theoAvatar).toHaveTextContent(/^T$/);
    // The name is in the text already, so the avatar is hidden from screen readers.
    for (const avatar of [annaAvatar, theoAvatar]) await expect(avatar).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.queryAllByRole('img')).toHaveLength(0);
    await expect(anna).toHaveTextContent('Anna (adult) — has a login account');
  },
};
