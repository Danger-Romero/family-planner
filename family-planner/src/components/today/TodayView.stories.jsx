import { MemoryRouter } from 'react-router-dom';
import { expect, fn, within } from 'storybook/test';
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
    savingIds: [],
    error: '',
    onToggle: fn(),
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
          '3. `TodayView` lays out the header, the two sections and the "+".',
          '4. `TaskCard` and `EventCard` draw one item each; `People` draws who is responsible and attending.',
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

    // The "+" opens the add-item form, 16px above the navigation bar.
    const add = canvas.getByRole('link', { name: 'New task or event' });
    await expect(add).toHaveAttribute('href', '/items');
    const nav = canvas.getByRole('navigation', { name: 'Main navigation' }).getBoundingClientRect();
    await expect(nav.top - add.getBoundingClientRect().bottom).toBeCloseTo(16, 0);
  },
};

/** The last card can scroll clear of the "+": the list ends with room for it. */
export const LastCardClearOfTheFab = {
  play: async ({ canvas }) => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    const last = cardOf(canvas, 'Fix the bike light').getBoundingClientRect();
    const add = canvas.getByRole('link', { name: 'New task or event' }).getBoundingClientRect();
    await expect(last.bottom).toBeLessThanOrEqual(add.top);
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
