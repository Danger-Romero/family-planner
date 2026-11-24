import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import TaskDialog from './TaskDialog.jsx';
import { sampleAssignments, sampleItems, sampleMembers } from './todaySample.js';

const kit = sampleItems.find((item) => item.id === 'kit');
const kitAssignments = sampleAssignments.filter((assignment) => assignment.item === 'kit');

/** The dialog is drawn in a portal at the end of <body>, outside the story's canvas. */
const page = (canvasElement) => within(canvasElement.ownerDocument.body);
/** The checkbox for `name` under `role` ("Responsible" or "Attending"). */
const person = (screen, role, name) => within(screen.getByRole('group', { name: role })).getByRole('checkbox', { name });
/** The avatar next to that checkbox. */
const avatarOf = (screen, role, name) => person(screen, role, name).closest('label').querySelector('.MuiAvatar-root');

const meta = {
  title: 'Components/TaskDialog',
  component: TaskDialog,
  tags: ['autodocs', 'ai-generated'],
  args: {
    open: true,
    task: null,
    members: sampleMembers,
    assignments: [],
    onSave: fn(async () => {}),
    onClose: fn(),
  },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    docs: {
      story: { inline: false, height: '640px' },
      description: {
        component: [
          'The dialog for adding a task on Today (the "+") and for changing one (tap its card).',
          '`src/components/today/TaskDialog.jsx`, built from MUI\'s Dialog and TextField and the themed',
          'Checkbox, Avatar and Button. Each person is a checkbox with their avatar: filled under',
          'Responsible and outlined under Attending, as on the task cards.',
          '',
          'Its fields start from `task` when it is mounted, so the page gives it a new `key` each time it',
          'opens. Saving calls `onSave({ title, dueAt, manuallyUrgent, assignments })` and waits for it;',
          'if that throws, the dialog shows the error and stays open.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** A new task: empty, the title field focused, nothing to add until it has a title. */
export const NewTask = {
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    const title = within(dialog).getByRole('textbox', { name: 'Title' });
    await waitFor(() => expect(title).toHaveFocus());
    const add = within(dialog).getByRole('button', { name: 'Add task' });
    await expect(add).toBeDisabled();

    await userEvent.type(title, '  Book the dentist ');
    fireEvent.change(within(dialog).getByLabelText('Due'), { target: { value: '2026-10-20T09:30' } });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Flag as urgent' }));
    await userEvent.click(person(screen, 'Responsible', 'Jonas'));
    await expect(person(screen, 'Responsible', 'Jonas')).toBeChecked();
    await userEvent.click(person(screen, 'Attending', 'Theo'));
    await userEvent.click(add);

    await expect(args.onSave).toHaveBeenCalledWith({
      title: 'Book the dentist',
      dueAt: new Date(2026, 9, 20, 9, 30),
      manuallyUrgent: true,
      assignments: [{ member: 'jonas', role: 'responsible' }, { member: 'theo', role: 'attending' }],
    });
    // Waiting for the page to close it, the fields are disabled and the avatars dimmed with them.
    await expect(add).toBeDisabled();
    await expect(person(screen, 'Responsible', 'Jonas')).toBeDisabled();
    await expect(getComputedStyle(avatarOf(screen, 'Responsible', 'Jonas')).opacity).toBe('0.38');
  },
};

/** Changing a task: its title, due time and people are filled in. */
export const EditTask = {
  args: { task: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    const title = within(dialog).getByRole('textbox', { name: 'Title' });
    await expect(title).toHaveValue('Pack football kit');
    // Not focused: on a phone the keyboard would cover the form.
    await expect(title).not.toHaveFocus();
    await expect(within(dialog).getByLabelText('Due')).toHaveValue('2026-10-19T15:00');
    await expect(within(dialog).getByRole('checkbox', { name: 'Flag as urgent' })).not.toBeChecked();
    await expect(person(screen, 'Responsible', 'Ella')).toBeChecked();
    await expect(person(screen, 'Responsible', 'Anna')).not.toBeChecked();
    // Each person has their avatar: filled under Responsible, outlined under Attending, as on the
    // cards. Ella's is her star. The two lists sit side by side.
    await expect(avatarOf(screen, 'Responsible', 'Ella').querySelector('svg')).not.toBeNull();
    await expect(avatarOf(screen, 'Responsible', 'Ella')).not.toHaveClass('MuiAvatar-outlined');
    await expect(avatarOf(screen, 'Responsible', 'Anna')).toHaveTextContent(/^A$/);
    await expect(avatarOf(screen, 'Attending', 'Ella')).toHaveClass('MuiAvatar-outlined');
    const columns = ['Responsible', 'Attending'].map((name) => screen.getByRole('group', { name }).getBoundingClientRect());
    await expect(columns[1].top).toBe(columns[0].top);
    await expect(columns[1].left).toBeGreaterThanOrEqual(columns[0].right);

    await userEvent.clear(title);
    await userEvent.type(title, 'Pack football kit and water bottle');
    await userEvent.click(person(screen, 'Responsible', 'Ella'));
    await userEvent.click(person(screen, 'Responsible', 'Theo'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith({
      title: 'Pack football kit and water bottle',
      dueAt: kit.dueAt,
      manuallyUrgent: false,
      assignments: [{ member: 'theo', role: 'responsible' }],
    });
  },
};

/** The ✕ in the due field takes the date away: the task goes under Anytime. */
export const RemoveTheDueDate = {
  args: { task: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.click(await screen.findByRole('button', { name: 'Remove the due date' }));
    await expect(screen.getByLabelText('Due')).toHaveValue('');
    await expect(screen.queryByRole('button', { name: 'Remove the due date' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith(expect.objectContaining({ dueAt: null }));
  },
};

/** If saving fails, the dialog says why and stays open with what was typed. */
export const SaveFails = {
  args: { task: kit, assignments: kitAssignments, onSave: fn(async () => { throw new Error('No connection'); }) },
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    const save = await screen.findByRole('button', { name: 'Save' });
    await userEvent.click(save);
    await expect(await screen.findByRole('alert')).toHaveTextContent('No connection');
    await expect(save).toBeEnabled();
    await expect(screen.getByRole('dialog', { name: 'Edit task' })).toBeInTheDocument();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

/** Cancel closes it without saving. */
export const Cancel = {
  args: { task: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    await userEvent.click(await page(canvasElement).findByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

/**
 * On the narrowest phones (320px), Attending goes under Responsible rather than squeezing the
 * names: each person stays on one line.
 */
export const NarrowPhone = {
  args: { task: kit, assignments: kitAssignments },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement }) => {
    const screen = page(canvasElement);
    await screen.findByRole('dialog', { name: 'Edit task' });
    const [responsible, attending] = ['Responsible', 'Attending'].map((name) =>
      screen.getByRole('group', { name }).getBoundingClientRect());
    await expect(attending.top).toBeGreaterThanOrEqual(responsible.bottom);
    for (const role of ['Responsible', 'Attending']) {
      for (const name of ['Anna', 'Jonas', 'Ella', 'Theo']) {
        await expect(person(screen, role, name).closest('label').getBoundingClientRect().height).toBe(48);
      }
    }
  },
};

/** The same dialog in the dark theme. */
export const DarkTheme = {
  args: { task: kit, assignments: kitAssignments },
  globals: { theme: 'Dark', viewport: { value: 'mobile2', isRotated: false } },
};
