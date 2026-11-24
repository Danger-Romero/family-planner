import { MemoryRouter } from 'react-router-dom';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import { sampleFamily, sampleMembers } from '../components/today/todaySample.js';
import TodayPage from './TodayPage.jsx';

// Flagged tasks without a date are urgent whatever the time, so these stories work on any day.
const task = (id, title) => ({
  id, kind: 'task', title, completed: false, dueAt: null, startsAt: null, endsAt: null,
  allDay: false, manuallyUrgent: true, note: '', visibility: 'everyone',
});
const data = {
  items: [task('pay', 'Pay football membership'), task('form', 'Return the school form')],
  members: sampleMembers,
  assignments: [{ id: 'a1', item: 'pay', member: 'jonas', role: 'responsible' }],
};

/** Stand-in for saving a task or event from the dialog: gives back what the database would. */
async function saveItem({ item: changed, values }) {
  const { assignments, ...fields } = values;
  const saved = { ...(changed ?? { ...task('new', ''), manuallyUrgent: false }), ...fields };
  return {
    item: saved,
    assignments: assignments.map((pair) => ({ id: `${saved.id}-${pair.member}-${pair.role}`, item: saved.id, ...pair })),
  };
}

/** Today as a date field's value. */
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** The dialog is drawn in a portal at the end of <body>, outside the story's canvas. */
const page = (canvasElement) => within(canvasElement.ownerDocument.body);

const meta = {
  title: 'Pages/TodayPage',
  component: TodayPage,
  tags: ['ai-generated'],
  args: {
    family: sampleFamily,
    member: sampleMembers[0],
    load: fn(async () => data),
    saveCompleted: fn(async () => {}),
    saveItem: fn(saveItem),
  },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'What `TodayPage` does around `TodayView`: loading, ticking a task and saving it, saving a task or',
          'event from the item dialog, and what happens when that fails. `load`, `saveCompleted` and `saveItem`',
          'default to the real services; these stories pass stand-ins, so nothing reaches the database.',
        ].join('\n'),
      },
    },
  },
  decorators: [(Story) => <MemoryRouter><Story /></MemoryRouter>],
};

export default meta;

/** Ticking a task shows it done at once and saves it. It stays where it was until the page reloads. */
export const TickATask = {
  play: async ({ args, canvas, userEvent }) => {
    const box = await canvas.findByRole('checkbox', { name: 'Done: Pay football membership' });
    await expect(args.load).toHaveBeenCalledWith(sampleFamily);
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await expect(args.saveCompleted).toHaveBeenCalledWith('pay', true);
    await waitFor(() => expect(box).toBeEnabled());
    const urgent = within(canvas.getByRole('region', { name: 'Urgent' }));
    await expect(urgent.getByRole('heading', { name: 'Pay football membership' })).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};

/** Tasks saved without a date (the add form's default) show under Anytime. */
export const TasksWithoutADate = {
  args: {
    load: fn(async () => ({
      items: [
        { ...task('bike', 'Fix the bike light'), manuallyUrgent: false },
        { ...task('plumber', 'Call the plumber'), manuallyUrgent: false },
      ],
      members: sampleMembers,
      assignments: [],
    })),
  },
  play: async ({ canvas }) => {
    const anytime = within(await canvas.findByRole('region', { name: 'Anytime' }));
    await expect(anytime.getAllByRole('heading', { level: 3 }).map((title) => title.textContent)).toEqual([
      'Call the plumber', 'Fix the bike light',
    ]);
  },
};

/** If saving fails, the tick is taken back and the page says so. */
export const SaveFails = {
  args: { saveCompleted: fn(async () => { throw new Error('offline'); }) },
  play: async ({ canvas, userEvent }) => {
    const box = await canvas.findByRole('checkbox', { name: 'Done: Pay football membership' });
    await userEvent.click(box);
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Couldn\'t save "Pay football membership". Try again.',
    );
    await expect(box).not.toBeChecked();
    await expect(box).toBeEnabled();
    // The other task is untouched.
    await expect(canvas.getByRole('checkbox', { name: 'Done: Return the school form' })).not.toBeChecked();
  },
};

/**
 * Changing a task in the dialog saves it and puts it where it belongs now: no longer important
 * and without a date, it moves from Urgent to Anytime.
 */
export const EditATask = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Edit: Pay football membership' }));
    const dialog = await page(canvasElement).findByRole('dialog', { name: 'Edit task' });
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Mark as important' }));
    await userEvent.click(within(dialog).getByRole('button', { name: /^People/ }));
    const screen = page(canvasElement);
    await userEvent.click(within(screen.getByRole('group', { name: "Anna's role" })).getByRole('button', { name: 'Responsible' }));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await expect(args.saveItem).toHaveBeenCalledWith({
      family: sampleFamily,
      member: sampleMembers[0],
      item: expect.objectContaining({ id: 'pay' }),
      values: {
        kind: 'task', title: 'Pay football membership', dueAt: null, manuallyUrgent: false,
        assignments: [{ member: 'jonas', role: 'responsible' }, { member: 'anna', role: 'responsible' }],
      },
    });
    const anytime = within(await canvas.findByRole('region', { name: 'Anytime' }));
    await expect(anytime.getByRole('heading', { name: 'Pay football membership' })).toBeInTheDocument();
    await expect(anytime.getByRole('img', { name: 'Anna' })).toBeInTheDocument();
    const urgent = within(canvas.getByRole('region', { name: 'Urgent' }));
    await expect(urgent.queryByRole('heading', { name: 'Pay football membership' })).toBeNull();
  },
};

/** A task added with the "+" shows up on the page, here important, so under Urgent. */
export const AddATask = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'New task or event' }));
    const dialog = await page(canvasElement).findByRole('dialog', { name: 'New task' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Renew passports');
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Mark as important' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await expect(args.saveItem).toHaveBeenCalledWith(expect.objectContaining({ item: null, member: sampleMembers[0] }));
    // While the dialog is open (and fading out), the page is hidden from screen readers.
    const urgent = within(await canvas.findByRole('region', { name: 'Urgent' }));
    await expect(urgent.getByRole('heading', { name: 'Renew passports' })).toBeInTheDocument();
  },
};

/** An event added with the "+" for all of today shows up in the schedule. */
export const AddAnEvent = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'New task or event' }));
    const dialog = await page(canvasElement).findByRole('dialog', { name: 'New task' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Event' }));
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'School photo day');
    fireEvent.change(within(dialog).getByLabelText(/^Date/), { target: { value: today() } });
    await userEvent.click(within(dialog).getByRole('switch', { name: 'All day' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await expect(args.saveItem).toHaveBeenCalledWith(
      expect.objectContaining({ item: null, values: expect.objectContaining({ kind: 'event', allDay: true }) }),
    );
    const schedule = within(await canvas.findByRole('region', { name: 'Schedule' }));
    const event = schedule.getByText('School photo day').closest('li');
    await expect(within(event).getByText('All day')).toBeInTheDocument();
  },
};

/** If saving fails, the dialog says why and stays open. Cancelling leaves the page as it was. */
export const SaveTaskFails = {
  args: { saveItem: fn(async () => { throw new Error('No connection'); }) },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Edit: Return the school form' }));
    const dialog = await page(canvasElement).findByRole('dialog', { name: 'Edit task' });
    const title = within(dialog).getByRole('textbox', { name: 'Title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Sign the school form');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expect(await within(dialog).findByRole('alert')).toHaveTextContent('No connection');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await expect(await canvas.findByRole('heading', { name: 'Return the school form' })).toBeInTheDocument();
    await expect(canvas.queryByRole('heading', { name: 'Sign the school form' })).toBeNull();
  },
};

/** If loading fails, the page says why and can try again. */
export const LoadFails = {
  args: { load: fn() },
  // Here, not in args: Storybook resets mocks before each story.
  beforeEach: ({ args }) => {
    args.load.mockRejectedValueOnce(new Error('No connection')).mockResolvedValue(data);
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('No connection');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    await expect(args.load).toHaveBeenCalledTimes(2);
  },
};

/** While loading. */
export const Loading = {
  args: { load: fn(() => new Promise(() => {})) },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading today');
  },
};
