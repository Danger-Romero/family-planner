import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import ItemDialog from './ItemDialog.jsx';
import { sampleAssignments, sampleItems, sampleMembers } from './todaySample.js';

const kit = sampleItems.find((item) => item.id === 'kit');
const kitAssignments = sampleAssignments.filter((assignment) => assignment.item === 'kit');

/** The dialog is drawn in a portal at the end of <body>, outside the story's canvas. */
const page = (canvasElement) => within(canvasElement.ownerDocument.body);
/** Sets a date or time field, as picking in the browser's own picker does. */
const pick = (field, value) => fireEvent.change(field, { target: { value } });
/** The People row on the main view. */
const peopleRow = (screen) => screen.getByRole('button', { name: /^People/ });
/** The `role` button ("Not involved", "Responsible", "Attending") of `name` on "Who is involved?". */
const roleButton = (screen, name, role) =>
  within(screen.getByRole('group', { name: `${name}'s role` })).getByRole('button', { name: role });
/** The avatar next to `name` on "Who is involved?". */
const avatarIn = (screen, name) =>
  screen.getByRole('group', { name: `${name}'s role` }).closest('li').querySelector('.MuiAvatar-root');

/** Opens "Who is involved?", gives each name its role, and comes back with Done. */
async function assign(screen, userEvent, roles) {
  await userEvent.click(peopleRow(screen));
  await screen.findByRole('heading', { name: 'Who is involved?' });
  for (const [name, role] of Object.entries(roles)) await userEvent.click(roleButton(screen, name, role));
  await userEvent.click(screen.getByRole('button', { name: 'Done' }));
  await screen.findByRole('dialog', { name: /^(New|Edit)/ });
}

const meta = {
  title: 'Components/ItemDialog',
  component: ItemDialog,
  tags: ['autodocs', 'ai-generated'],
  args: {
    open: true,
    item: null,
    members: sampleMembers,
    assignments: [],
    memberId: 'anna',
    onSave: fn(async () => {}),
    onClose: fn(),
  },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    docs: {
      story: { inline: false, height: '844px' },
      description: {
        component: [
          'Adding a task or an event on Today (the "+"), and changing a task (tap its card): the',
          'wireframe\'s **03 New task / event** screen, with **04 Assign people** as a second view.',
          '`src/components/today/ItemDialog.jsx`, built from MUI\'s Dialog and TextField and the themed',
          'Button, Switch, ToggleButtonGroup, Card and Avatar. Full screen on a phone, a dialog on larger',
          'screens.',
          '',
          '- **Main view:** Task or Event (only when adding), the title, when (a task\'s date and deadline;',
          '  an event\'s date, start and end, or all day), **Mark as important** (tasks), and a **People** row.',
          '- **Who is involved?:** each family member is not involved, responsible or attending (one role',
          '  each). **Done** keeps the changes; **Back** and Escape drop them.',
          '',
          'The wireframe\'s Repeat, Who can see it and template rows are left out: the app doesn\'t have',
          'those yet.',
          '',
          'Its fields start from `item` when it is mounted, so the page gives it a new `key` each time it',
          'opens. Saving calls `onSave(values)` (see `readItemForm` in `src/services/today.js`) and waits',
          'for it; if that throws, the dialog shows the error and stays open.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/**
 * A new task: Task is picked and the title field has the focus. The deadline waits for a date.
 * Nothing to save until it has a title.
 */
export const NewTask = {
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await expect(screen.getByRole('button', { name: 'Task' })).toHaveAttribute('aria-pressed', 'true');
    const title = screen.getByRole('textbox', { name: 'Title' });
    await waitFor(() => expect(title).toHaveFocus());
    await expect(title).toHaveAttribute('placeholder', 'What needs to happen?');
    const save = screen.getByRole('button', { name: 'Save' });
    await expect(save).toBeDisabled();
    await expect(screen.getByLabelText('Deadline')).toBeDisabled();
    await expect(dialog).toHaveTextContent('Without a date, it goes under Anytime.');

    await userEvent.type(title, '  Book the dentist ');
    pick(screen.getByLabelText('Date'), '2026-10-20');
    await expect(screen.getByLabelText('Deadline')).toBeEnabled();
    pick(screen.getByLabelText('Deadline'), '09:30');
    await userEvent.click(screen.getByRole('switch', { name: 'Mark as important' }));
    await assign(screen, userEvent, { Jonas: 'Responsible', Theo: 'Attending' });
    // The People row shows them: filled for responsible, outlined for attending.
    await expect(within(peopleRow(screen)).getByRole('img', { name: 'Jonas' })).not.toHaveClass('MuiAvatar-outlined');
    await expect(within(peopleRow(screen)).getByRole('img', { name: 'Theo' })).toHaveClass('MuiAvatar-outlined');
    await userEvent.click(save);

    await expect(args.onSave).toHaveBeenCalledWith({
      kind: 'task',
      title: 'Book the dentist',
      dueAt: new Date(2026, 9, 20, 9, 30),
      manuallyUrgent: true,
      assignments: [{ member: 'jonas', role: 'responsible' }, { member: 'theo', role: 'attending' }],
    });
    // Waiting for the page to close it.
    await expect(save).toBeDisabled();
  },
};

/** A task with a date but no time is due at the end of that day. */
export const TaskWithoutATime = {
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.type(await screen.findByRole('textbox', { name: 'Title' }), 'Pay the school trip');
    pick(screen.getByLabelText('Date'), '2026-10-21');
    await expect(screen.getByRole('dialog')).toHaveTextContent("Without a time, it's due at the end of the day.");
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith(expect.objectContaining({ dueAt: new Date(2026, 9, 21, 23, 59) }));
  },
};

/** Switching to Event: a date, when it starts and ends, and All day. No "Mark as important". */
export const NewEvent = {
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.click(await screen.findByRole('button', { name: 'Event' }));
    await expect(screen.getByRole('dialog', { name: 'New event' })).toBeInTheDocument();
    await expect(screen.getByRole('button', { name: 'Event' })).toHaveAttribute('aria-pressed', 'true');
    await expect(screen.queryByRole('switch', { name: 'Mark as important' })).toBeNull();

    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Football practice');
    pick(screen.getByLabelText(/^Date/), '2026-10-21');
    pick(screen.getByLabelText(/^Starts/), '15:30');
    pick(screen.getByLabelText('Ends'), '16:30');
    await assign(screen, userEvent, { Anna: 'Responsible', Ella: 'Attending' });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith({
      kind: 'event',
      title: 'Football practice',
      startsAt: new Date(2026, 9, 21, 15, 30),
      endsAt: new Date(2026, 9, 21, 16, 30),
      allDay: false,
      assignments: [{ member: 'anna', role: 'responsible' }, { member: 'ella', role: 'attending' }],
    });
  },
};

/** All day: the start and end go away, and the event fills the day. */
export const AllDayEvent = {
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.click(await screen.findByRole('button', { name: 'Event' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'School trip');
    pick(screen.getByLabelText(/^Date/), '2026-10-22');
    const allDay = screen.getByRole('switch', { name: 'All day' });
    await userEvent.click(allDay);
    await expect(allDay).toBeChecked();
    await expect(screen.queryByLabelText(/^Starts/)).toBeNull();
    await expect(screen.queryByLabelText('Ends')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ startsAt: new Date(2026, 9, 22), endsAt: null, allDay: true }),
    );
  },
};

/** An event that ends before it starts isn't saved: the dialog says what to fix. */
export const EventEndsBeforeItStarts = {
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.click(await screen.findByRole('button', { name: 'Event' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Dentist');
    pick(screen.getByLabelText(/^Date/), '2026-10-19');
    pick(screen.getByLabelText(/^Starts/), '16:00');
    pick(screen.getByLabelText('Ends'), '15:00');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(await screen.findByRole('alert')).toHaveTextContent('The event has to end after it starts.');
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

/** Changing a task: its fields are filled in, and it can't be turned into an event. */
export const EditTask = {
  args: { item: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await screen.findByRole('dialog', { name: 'Edit task' });
    await expect(screen.queryByRole('group', { name: 'Task or event' })).toBeNull();
    const title = screen.getByRole('textbox', { name: 'Title' });
    await expect(title).toHaveValue('Pack football kit');
    // Not focused: on a phone the keyboard would cover the form.
    await expect(title).not.toHaveFocus();
    await expect(screen.getByLabelText('Date')).toHaveValue('2026-10-19');
    await expect(screen.getByLabelText('Deadline')).toHaveValue('15:00');
    await expect(screen.getByRole('switch', { name: 'Mark as important' })).not.toBeChecked();
    await expect(within(peopleRow(screen)).getByRole('img', { name: 'Ella' })).toBeInTheDocument();

    await userEvent.clear(title);
    await userEvent.type(title, 'Pack football kit and water bottle');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith({
      kind: 'task',
      title: 'Pack football kit and water bottle',
      dueAt: kit.dueAt,
      manuallyUrgent: false,
      assignments: [{ member: 'ella', role: 'responsible' }],
    });
  },
};

/** "Remove date" takes the date and deadline away: the task goes under Anytime. */
export const RemoveTheDate = {
  args: { item: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.click(await screen.findByRole('button', { name: 'Remove date' }));
    await expect(screen.getByLabelText('Date')).toHaveValue('');
    await expect(screen.getByLabelText('Deadline')).toHaveValue('');
    await expect(screen.getByLabelText('Deadline')).toBeDisabled();
    await expect(screen.queryByRole('button', { name: 'Remove date' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith(expect.objectContaining({ dueAt: null }));
  },
};

/**
 * "Who is involved?": who has each role at the top, then each member with one role. With no one
 * responsible it warns. Done keeps the changes and goes back to the People row.
 */
export const WhoIsInvolved = {
  args: { item: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.click(await screen.findByRole('button', { name: /^People/ }));
    const heading = await screen.findByRole('heading', { name: 'Who is involved?' });
    await waitFor(() => expect(heading).toHaveFocus());
    await expect(screen.getByRole('dialog')).toHaveAccessibleName('Who is involved?');
    await expect(roleButton(screen, 'Ella', 'Responsible')).toHaveAttribute('aria-pressed', 'true');
    await expect(roleButton(screen, 'Anna', 'Not involved')).toHaveAttribute('aria-pressed', 'true');
    await expect(screen.getByText('Adult · you')).toBeInTheDocument();
    // Filled for responsible, dashed for not involved.
    await expect(avatarIn(screen, 'Ella')).not.toHaveClass('MuiAvatar-dashed');
    await expect(avatarIn(screen, 'Anna')).toHaveClass('MuiAvatar-dashed');
    await expect(screen.queryByText(/Pick at least one person/)).toBeNull();

    // One role each: Attending turns Responsible off.
    await userEvent.click(roleButton(screen, 'Ella', 'Attending'));
    await expect(roleButton(screen, 'Ella', 'Responsible')).toHaveAttribute('aria-pressed', 'false');
    await expect(avatarIn(screen, 'Ella')).toHaveClass('MuiAvatar-outlined');
    await expect(screen.getByText(/Pick at least one person who is responsible/)).toBeVisible();
    await expect(screen.getByText('No one yet')).toBeVisible();
    // Tapping the role that's on keeps it.
    await userEvent.click(roleButton(screen, 'Ella', 'Attending'));
    await expect(roleButton(screen, 'Ella', 'Attending')).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(roleButton(screen, 'Theo', 'Responsible'));
    await expect(screen.queryByText(/Pick at least one person/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(peopleRow(screen)).toHaveFocus());
    await expect(within(peopleRow(screen)).getByRole('img', { name: 'Theo' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        assignments: [{ member: 'ella', role: 'attending' }, { member: 'theo', role: 'responsible' }],
      }),
    );
  },
};

/** Back, or Escape, leaves "Who is involved?" without the changes. The dialog stays open. */
export const BackDropsTheChanges = {
  args: { item: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    await userEvent.click(await screen.findByRole('button', { name: /^People/ }));
    await userEvent.click(roleButton(screen, 'Anna', 'Responsible'));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(peopleRow(screen)).toHaveFocus());
    await expect(within(peopleRow(screen)).queryByRole('img', { name: 'Anna' })).toBeNull();

    await userEvent.click(peopleRow(screen));
    await userEvent.click(roleButton(screen, 'Anna', 'Responsible'));
    await userEvent.keyboard('{Escape}');
    await expect(await screen.findByRole('dialog', { name: 'Edit task' })).toBeInTheDocument();
    await expect(within(peopleRow(screen)).queryByRole('img', { name: 'Anna' })).toBeNull();
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

/** If saving fails, the dialog says why and stays open with what was typed. */
export const SaveFails = {
  args: { item: kit, assignments: kitAssignments, onSave: fn(async () => { throw new Error('No connection'); }) },
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
  args: { item: kit, assignments: kitAssignments },
  play: async ({ args, canvasElement, userEvent }) => {
    await userEvent.click(await page(canvasElement).findByRole('button', { name: 'Cancel' }));
    await expect(args.onClose).toHaveBeenCalled();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};

/**
 * On a phone the dialog fills the screen, and on the narrowest (320px) nothing sticks out sideways:
 * the deadline goes under the date, so the whole date shows, and the role buttons wrap their
 * labels.
 */
export const NarrowPhone = {
  args: { item: kit, assignments: kitAssignments },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvasElement, userEvent }) => {
    const screen = page(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    const paper = dialog.closest('.MuiDialog-paper');
    await expect(paper.getBoundingClientRect().width).toBe(canvasElement.ownerDocument.documentElement.clientWidth);
    const content = () => paper.querySelector('.MuiDialogContent-root');
    await expect(content().scrollWidth).toBeLessThanOrEqual(content().clientWidth);
    const date = screen.getByLabelText('Date').closest('.MuiTextField-root').getBoundingClientRect();
    const deadline = screen.getByLabelText('Deadline').closest('.MuiTextField-root').getBoundingClientRect();
    await expect(deadline.top).toBeGreaterThanOrEqual(date.bottom);

    await userEvent.click(peopleRow(screen));
    await screen.findByRole('heading', { name: 'Who is involved?' });
    await expect(content().scrollWidth).toBeLessThanOrEqual(content().clientWidth);
    for (const member of sampleMembers) {
      const group = screen.getByRole('group', { name: `${member.name}'s role` });
      // Inside its row, not out into the dialog's padding.
      await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
      await expect(group.getBoundingClientRect().right).toBeLessThanOrEqual(group.closest('li').getBoundingClientRect().right);
      for (const button of within(group).getAllByRole('button')) {
        await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
      }
    }
  },
};

/** The same dialog in the dark theme. */
export const DarkTheme = {
  args: { item: kit, assignments: kitAssignments },
  globals: { theme: 'Dark', viewport: { value: 'mobile2', isRotated: false } },
};
