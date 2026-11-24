import { MemoryRouter } from 'react-router-dom';
import { expect, fn, waitFor, within } from 'storybook/test';
import NavigationBar from '../NavigationBar.jsx';
import { planToday } from '../../services/today.js';
import { scheme } from '../../theme/m3.js';
import { resolve, rgba } from '../../theme/components/storyHelpers.js';
import TodayView from './TodayView.jsx';
import { sampleAssignments, sampleFamily, sampleItems, sampleMembers, sampleNow } from './todaySample.js';

const plan = planToday(sampleItems, sampleNow);

/** The card (list item) with `title`. */
const cardOf = (canvas, title) => canvas.getByText(title).closest('li');
const titlesIn = (section) => section.getAllByRole('listitem').map((item) => item.querySelector('h3').textContent);
const sectionOf = (canvas, name) => within(canvas.getByRole('region', { name }));
/** The dialog is drawn in a portal at the end of <body>, outside the story's canvas. */
const page = (canvasElement) => within(canvasElement.ownerDocument.body);
/** What a tap in the middle of `element` lands on. */
const hit = (element) => {
  const box = element.getBoundingClientRect();
  return element.ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
};

const meta = {
  title: 'Pages/Today',
  component: TodayView,
  tags: ['autodocs', 'ai-generated'],
  args: {
    familyName: sampleFamily.name,
    now: sampleNow,
    urgent: plan.urgent,
    schedule: plan.schedule,
    anytime: plan.anytime,
    members: sampleMembers,
    assignments: sampleAssignments,
    memberId: 'anna',
    savingIds: [],
    error: '',
    onToggle: fn(),
    onSaveItem: fn(async () => {}),
  },
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'The Today page as drawn by `TodayView` (`src/components/today/TodayView.jsx`), with sample data',
          'for the wireframe\'s day. How the page is put together:',
          '',
          '1. `TodayPage` (`src/pages/TodayPage.jsx`) loads the items, members and assignments, and saves a',
          '   ticked task.',
          '2. `planToday()` (`src/services/today.js`) decides what goes in **Urgent**, **Schedule** and',
          '   **Anytime** (tasks without a date), in which order. Plain functions, unit-tested in',
          '   `tests/today.test.js`.',
          '3. `TodayView` lays out the header, the sections and the "+".',
          '4. `TaskCard` and `EventCard` draw one item each; `People` draws who is responsible and attending.',
          '   A task card is one big button: tapping it opens `ItemDialog` to change the task. The "+" opens',
          '   the same dialog to add a task or an event.',
          '5. They are built from the themed MUI components (Card, Checkbox, Avatar, FAB), so the look comes',
          '   from `src/theme` and the components don\'t set colours of their own.',
          '',
          'A task is urgent when it is flagged, overdue or due within 3 hours.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
        <NavigationBar />
      </MemoryRouter>
    ),
  ],
};

export default meta;

/** The wireframe's day: two urgent tasks, then the day in time order. */
export const Default = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    await expect(canvas.getByText('The Hansen family')).toBeInTheDocument();
    await expect(canvas.getByText('Mon 19 October')).toBeInTheDocument();

    // Urgent: two tasks with an error outline, saying why and when.
    const urgent = sectionOf(canvas, 'Urgent');
    const urgentTitles = urgent.getAllByRole('listitem').map((item) => item.querySelector('h3').textContent);
    await expect(urgentTitles).toEqual(['Sign up Ella for school trip', 'Pay football membership']);
    const error = rgba(resolve(canvasElement, 'color', scheme('error')));
    for (const title of urgentTitles) {
      const card = getComputedStyle(cardOf(canvas, title));
      await expect(card.borderTopWidth).toBe('2px');
      await expect(rgba(card.borderTopColor)).toEqual(error);
    }
    const signUp = within(cardOf(canvas, 'Sign up Ella for school trip'));
    await expect(signUp.getByText('Due in 2 h')).toBeInTheDocument();
    await expect(signUp.getByText('12:00')).toBeInTheDocument();
    const pay = within(cardOf(canvas, 'Pay football membership'));
    await expect(pay.getByText('Flagged')).toBeInTheDocument();
    await expect(pay.getByText('Wed 21 Oct')).toBeInTheDocument();

    // Schedule: the rest of the day in time order.
    const schedule = sectionOf(canvas, 'Schedule');
    await expect(schedule.getAllByRole('listitem').map((item) => item.querySelector('h3').textContent)).toEqual([
      'School run', 'Water the plants', 'Pack football kit', 'Football practice', 'Dentist', 'Buy groceries for the week',
    ]);
    const run = within(cardOf(canvas, 'School run'));
    await expect(run.getByText('07:45')).toBeInTheDocument();
    await expect(run.getByText('08:15')).toBeInTheDocument();
    await expect(run.getByRole('img', { name: 'Jonas' })).not.toHaveClass('MuiAvatar-outlined');
    await expect(run.getByRole('img', { name: 'Ella' })).toHaveClass('MuiAvatar-outlined');
    await expect(run.getByRole('img', { name: 'Theo' })).toHaveClass('MuiAvatar-outlined');
    await expect(within(cardOf(canvas, 'Pack football kit')).getByText('by 15:00')).toBeInTheDocument();
    await expect(within(cardOf(canvas, 'Buy groceries for the week')).getByText('No one responsible')).toBeInTheDocument();

    // Anytime: tasks without a date, by title, with no time and no error outline.
    const anytime = sectionOf(canvas, 'Anytime');
    await expect(titlesIn(anytime)).toEqual(['Call the plumber', 'Fix the bike light']);
    const bike = cardOf(canvas, 'Fix the bike light');
    await expect(within(bike).queryByText(/^by /)).toBeNull();
    await expect(within(bike).getByRole('img', { name: 'Theo' })).toBeInTheDocument();
    await expect(getComputedStyle(bike).borderTopWidth).toBe('1px');

    // A done task is ticked and crossed out.
    const plants = within(cardOf(canvas, 'Water the plants'));
    await expect(plants.getByRole('checkbox', { name: 'Done: Water the plants' })).toBeChecked();
    await expect(getComputedStyle(plants.getByRole('heading', { level: 3 })).textDecorationLine).toBe('line-through');

    // Ticking asks the page to save it.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Done: Pack football kit' }));
    await expect(args.onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 'kit' }), true);

    // The "+" sits 16px above the navigation bar.
    const add = canvas.getByRole('button', { name: 'New task or event' });
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' }).getBoundingClientRect();
    await expect(nav.top - add.getBoundingClientRect().bottom).toBeCloseTo(16, 0);
  },
};

/** The last card can scroll clear of the "+": the list ends with room for it. */
export const LastCardClearOfTheFab = {
  play: async ({ canvas }) => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    const last = cardOf(canvas, 'Fix the bike light').getBoundingClientRect();
    const add = canvas.getByRole('button', { name: 'New task or event' }).getBoundingClientRect();
    await expect(last.bottom).toBeLessThanOrEqual(add.top);
  },
};

/**
 * The whole task card is a button that opens the item dialog with the task filled in. Only the
 * checkbox on it does something else. Saving hands the changes to the page and closes the dialog.
 */
export const EditATask = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const card = cardOf(canvas, 'Pack football kit');
    card.scrollIntoView({ block: 'center' });
    const edit = within(card).getByRole('button', { name: 'Edit: Pack football kit' });
    const box = within(card).getByRole('checkbox', { name: 'Done: Pack football kit' });

    // The button fills the card (inside its 1px outline)...
    await expect(edit.offsetWidth).toBe(card.clientWidth);
    await expect(edit.offsetHeight).toBe(card.clientHeight);
    // ...and a tap anywhere on the card lands on it, except on the checkbox.
    await expect(edit.contains(hit(within(card).getByRole('heading', { level: 3 })))).toBe(true);
    await expect(edit.contains(hit(within(card).getByRole('img', { name: 'Ella' })))).toBe(true);
    await expect(hit(box)).toBe(box);

    // Tabbing reaches the checkbox first, then the card, which shows the focus ring.
    box.focus();
    await userEvent.tab();
    await expect(edit).toHaveFocus();
    await expect(getComputedStyle(card).outlineWidth).toBe('3px');

    await userEvent.click(edit);
    const screen = page(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: 'Edit task' });
    const title = within(dialog).getByRole('textbox', { name: 'Title' });
    await expect(title).toHaveValue('Pack football kit');
    await userEvent.type(title, ' and boots');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expect(args.onSaveItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'kit' }),
      { kind: 'task', title: 'Pack football kit and boots', dueAt: new Date(2026, 9, 19, 15), manuallyUrgent: false,
        assignments: [{ member: 'ella', role: 'responsible' }] },
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(args.onToggle).not.toHaveBeenCalled();
  },
};

/** The "+" opens the same dialog, empty, to add a task or an event. */
export const NewTask = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New task or event' }));
    const screen = page(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await expect(within(dialog).getByRole('group', { name: 'Task or event' })).toBeInTheDocument();
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Buy birthday present');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expect(args.onSaveItem).toHaveBeenCalledWith(null, {
      kind: 'task', title: 'Buy birthday present', dueAt: null, manuallyUrgent: false, assignments: [],
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/**
 * A new task that was saved, but not its people: the dialog says so and goes on editing that
 * task, so saving again doesn't add it twice.
 */
export const NewTaskSavedWithoutItsPeople = {
  args: { onSaveItem: fn() },
  beforeEach: ({ args }) => {
    const saved = { ...sampleItems.find((item) => item.id === 'bike'), id: 'new', title: 'Buy birthday present' };
    const failure = Object.assign(new Error('"Buy birthday present" was saved, but not who\'s responsible and attending. Try again.'), { item: saved });
    args.onSaveItem.mockRejectedValueOnce(failure).mockResolvedValue();
  },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'New task or event' }));
    const screen = page(canvasElement);
    const dialog = await screen.findByRole('dialog', { name: 'New task' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Buy birthday present');
    await userEvent.click(within(dialog).getByRole('button', { name: /^People/ }));
    await userEvent.click(within(screen.getByRole('group', { name: "Anna's role" })).getByRole('button', { name: 'Responsible' }));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await expect(await within(dialog).findByRole('alert')).toHaveTextContent('was saved, but not who\'s responsible');
    await expect(dialog).toHaveAccessibleName('Edit task');
    // A task can't become an event any more.
    await expect(within(dialog).queryByRole('group', { name: 'Task or event' })).toBeNull();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await expect(args.onSaveItem).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'new' }),
      expect.objectContaining({ assignments: [{ member: 'anna', role: 'responsible' }] }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

/** Tasks without a date and nothing else: they still show, under Anytime. */
export const OnlyTasksWithoutADate = {
  args: planToday(sampleItems.filter((item) => item.kind === 'task' && !item.dueAt), sampleNow),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('region', { name: 'Urgent' })).toBeNull();
    await expect(sectionOf(canvas, 'Schedule').getByText('Nothing planned for today.')).toBeInTheDocument();
    await expect(titlesIn(sectionOf(canvas, 'Anytime'))).toEqual(['Call the plumber', 'Fix the bike light']);
  },
};

/** Nothing urgent, nothing planned and nothing without a date. */
export const Empty = {
  args: { urgent: [], schedule: [], anytime: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('region', { name: 'Urgent' })).toBeNull();
    await expect(canvas.queryByRole('region', { name: 'Anytime' })).toBeNull();
    await expect(sectionOf(canvas, 'Schedule').getByText('Nothing planned for today.')).toBeInTheDocument();
  },
};

/** While a ticked task is being saved, its checkbox waits. */
export const Saving = {
  args: { savingIds: ['kit'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'Done: Pack football kit' })).toBeDisabled();
    await expect(canvas.getByRole('checkbox', { name: 'Done: Water the plants' })).toBeEnabled();
  },
};

/** A save that failed is reported above the lists. */
export const SaveError = {
  args: { error: 'Couldn\'t save "Pack football kit". Try again.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Couldn\'t save "Pack football kit". Try again.');
  },
};

/** The same day in the dark theme. */
export const DarkTheme = {
  globals: { theme: 'Dark', viewport: { value: 'mobile2', isRotated: false } },
};
