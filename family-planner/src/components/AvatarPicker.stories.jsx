import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { avatarIcons } from '../services/avatars.js';
import { scheme } from '../theme/m3.js';
import { resolve, rgba } from '../theme/components/storyHelpers.js';
import AddMemberForm from './AddMemberForm.jsx';
import AvatarPicker from './AvatarPicker.jsx';

/** The picker with its value kept in state, as a form would. */
function Controlled({ value: initial = '', onChange, ...args }) {
  const [value, setValue] = useState(initial);
  return (
    <AvatarPicker
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const groupOf = (canvas) => within(canvas.getByRole('group', { name: 'Avatar' }));
/** The round choice (the label) around a radio button. */
const choiceOf = (radio) => radio.closest('label');

const meta = {
  title: 'Components/AvatarPicker',
  component: AvatarPicker,
  tags: ['autodocs', 'ai-generated'],
  args: { name: 'Ella', onChange: fn() },
  render: (args) => <Controlled {...args} />,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Chooses a family member\'s avatar when they\'re added: their initial, or one of 12 icons.',
          'Used in the "Add a family member" form; the choice is saved as `Member.avatarIcon`.',
          '',
          '```jsx',
          '<AvatarPicker name={name} value={avatarIcon} onChange={setAvatarIcon} />',
          '```',
          '',
          '`value` is `""` for the initial or an icon name from `src/services/avatars.js`. `name` is the',
          'name typed so far, for the initial\'s preview ("?" while it\'s empty).',
          '',
          'Radio buttons underneath: Tab reaches the group, arrow keys change the choice. Each choice is',
          'a 44×44px target, and the chosen one has a ring.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** The initial and the 12 icons. Click one to choose it. */
export const Default = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const group = groupOf(canvas);
    const radios = group.getAllByRole('radio');
    await expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'Initial',
      ...avatarIcons.map((icon) => icon.label),
    ]);
    const initial = group.getByRole('radio', { name: 'Initial' });
    await expect(initial).toBeChecked();
    await expect(choiceOf(initial).querySelector('.MuiAvatar-root')).toHaveTextContent(/^E$/);
    for (const radio of radios) {
      const box = choiceOf(radio).getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(44);
      await expect(box.height).toBeGreaterThanOrEqual(44);
    }
    // The avatars are pictures of the choices; the radio buttons carry the names.
    await expect(group.queryAllByRole('img')).toHaveLength(0);

    const rocket = group.getByRole('radio', { name: 'Rocket' });
    await userEvent.click(rocket);
    await expect(rocket).toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith('rocket');

    const primary = rgba(resolve(canvasElement, 'color', scheme('primary')));
    const chosen = getComputedStyle(choiceOf(rocket));
    await expect(chosen.borderTopWidth).toBe('2px');
    await expect(rgba(chosen.borderTopColor)).toEqual(primary);
    await expect(rgba(getComputedStyle(choiceOf(initial)).borderTopColor)[3]).toBe(0);
  },
};

/** Tab reaches the chosen one and shows the focus ring; the arrow keys change the choice. */
export const Keyboard = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const group = groupOf(canvas);
    const initial = group.getByRole('radio', { name: 'Initial' });
    await userEvent.tab();
    await expect(initial).toHaveFocus();
    const ring = getComputedStyle(choiceOf(initial));
    await expect(ring.outlineStyle).toBe('solid');
    await expect(ring.outlineWidth).toBe('3px');
    await expect(ring.outlineOffset).toBe('2px');
    await expect(rgba(ring.outlineColor)).toEqual(rgba(resolve(canvasElement, 'color', scheme('secondary'))));

    await userEvent.keyboard('{ArrowRight}');
    const paw = group.getByRole('radio', { name: 'Paw' });
    await expect(paw).toBeChecked();
    await expect(paw).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith('pets');
  },
};

/** Before a name is typed, the initial shows "?". */
export const EmptyName = {
  args: { name: '' },
  play: async ({ canvas }) => {
    const initial = groupOf(canvas).getByRole('radio', { name: 'Initial' });
    await expect(choiceOf(initial).querySelector('.MuiAvatar-root')).toHaveTextContent(/^\?$/);
  },
};

/** While the form is saving. */
export const Disabled = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    for (const radio of groupOf(canvas).getAllByRole('radio')) await expect(radio).toBeDisabled();
  },
};

/** In the "Add a family member" form: the chosen icon is sent with the new member. */
export const InAddMemberForm = {
  args: { onAdd: fn() },
  render: ({ onAdd }) => <AddMemberForm onAdd={onAdd} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Name'), 'Ella');
    await userEvent.click(canvas.getByRole('radio', { name: 'Star' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add member' }));
    await waitFor(() =>
      expect(args.onAdd).toHaveBeenCalledWith({
        name: 'Ella',
        memberType: 'child',
        username: '',
        birthDate: '',
        avatarIcon: 'star',
      }),
    );
    // After saving, the form starts over with the initial.
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Initial' })).toBeChecked());
    await expect(canvas.getByRole('status')).toBeInTheDocument();
  },
};
