import { MemoryRouter } from 'react-router-dom';
import { expect, fn, waitFor, within } from 'storybook/test';
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

const meta = {
  title: 'Pages/TodayPage',
  component: TodayPage,
  tags: ['ai-generated'],
  args: {
    family: sampleFamily,
    load: fn(async () => data),
    saveCompleted: fn(async () => {}),
  },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'What `TodayPage` does around `TodayView`: loading, ticking a task and saving it, and what',
          'happens when that fails. `load` and `saveCompleted` default to the real services; these',
          'stories pass stand-ins, so nothing reaches the database.',
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
