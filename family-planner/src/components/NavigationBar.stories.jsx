import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect } from 'storybook/test';
import NavigationBar from './NavigationBar.jsx';

/** Shows the current route above the bar, so you can see where a tab leads. */
function CurrentPath() {
  const { pathname } = useLocation();
  return <p>Page: {pathname}</p>;
}

const tabNames = ['Today', 'Calendar', 'Plan Week', 'Family'];
const bar = (canvas) => canvas.getByRole('navigation', { name: 'Main navigation' });
const selectedTabs = (canvas) =>
  canvas.queryAllByRole('link', { current: 'page' }).map((link) => link.textContent);
const indicatorOf = (link) => link.querySelector('.NavigationBar-indicator');
const labelOf = (link) => link.querySelector('.MuiBottomNavigationAction-label');

const meta = {
  title: 'Components/NavigationBar',
  component: NavigationBar,
  tags: ['autodocs', 'ai-generated'],
  parameters: {
    layout: 'fullscreen',
    // The page the story starts on.
    route: '/',
    docs: {
      description: {
        component: [
          "The app's main navigation: a **Material 3 Expressive** navigation bar fixed to the bottom of the",
          "screen, built on MUI's `BottomNavigation` (`src/components/NavigationBar.jsx`).",
          '',
          '| Tab | Route |',
          '| --- | --- |',
          '| Today | `/` (also highlighted on `/items`, which will become part of Today) |',
          '| Calendar | `/calendar` |',
          '| Plan Week | `/plan-week` |',
          '| Family | `/family` |',
          '',
          'The tab for the current route is highlighted with a pill and a filled icon, and has `aria-current="page"`.',
          'Below 600px the label sits under the icon; from 600px it sits beside the icon, and the tabs group in the middle.',
          'The bar reserves its own height at the end of the page, so nothing is hidden behind it.',
          '',
          '```jsx',
          '<NavigationBar />  // no props; render it inside the router',
          '```',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story, { parameters }) => (
      <MemoryRouter initialEntries={[parameters.route]}>
        <CurrentPath />
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

/** On Today (`/`). Checks the tabs, their links, the bar's 64px height and the 44px touch targets. */
export const Today = {
  parameters: { route: '/' },
  play: async ({ canvas }) => {
    const links = canvas.getAllByRole('link');
    await expect(links.map((link) => link.textContent)).toEqual(tabNames);
    await expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/calendar', '/plan-week', '/family']);
    await expect(selectedTabs(canvas)).toEqual(['Today']);
    await expect(bar(canvas).getBoundingClientRect().height).toBe(64);
    for (const link of links) {
      const box = link.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(44);
      await expect(box.height).toBeGreaterThanOrEqual(44);
    }
  },
};

/** On the Items page (`/items`): Today stays highlighted, since Items will become part of Today. */
export const Items = {
  parameters: { route: '/items' },
  play: async ({ canvas }) => expect(selectedTabs(canvas)).toEqual(['Today']),
};

export const Calendar = {
  parameters: { route: '/calendar' },
  play: async ({ canvas }) => expect(selectedTabs(canvas)).toEqual(['Calendar']),
};

export const PlanWeek = {
  parameters: { route: '/plan-week' },
  play: async ({ canvas }) => expect(selectedTabs(canvas)).toEqual(['Plan Week']),
};

/** On Family, reached with a trailing slash (`/family/`). */
export const Family = {
  parameters: { route: '/family/' },
  play: async ({ canvas }) => expect(selectedTabs(canvas)).toEqual(['Family']),
};

/** On a route that isn't a tab: nothing is highlighted. */
export const NotFound = {
  parameters: { route: '/does-not-exist' },
  play: async ({ canvas }) => expect(selectedTabs(canvas)).toEqual([]),
};

/** Clicking a tab goes to its page and moves the highlight. */
export const Navigate = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('link', { name: 'Calendar' }));
    await expect(selectedTabs(canvas)).toEqual(['Calendar']);
    await expect(canvas.getByText('Page: /calendar')).toBeInTheDocument();
  },
};

/** Tab to the first tab with the keyboard: it shows a focus ring around its pill. */
export const KeyboardFocus = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const today = canvas.getByRole('link', { name: 'Today' });
    await expect(today).toHaveFocus();
    await expect(getComputedStyle(indicatorOf(today)).outlineStyle).toBe('solid');
  },
};

/** A 320px phone: labels under the icons, 56×32px pill, and every label fits on one line. */
export const Phone = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(window.innerWidth).toBeLessThan(600);
    const today = canvas.getByRole('link', { name: 'Today' });
    const pill = indicatorOf(today).getBoundingClientRect();
    await expect([pill.width, pill.height]).toEqual([56, 32]);
    await expect(labelOf(today).getBoundingClientRect().top).toBeGreaterThanOrEqual(pill.bottom);
    for (const link of canvas.getAllByRole('link')) {
      const label = labelOf(link);
      // Fits inside its tab, on one line.
      await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(link.getBoundingClientRect().width);
      await expect(label.getBoundingClientRect().height).toBe(parseFloat(getComputedStyle(label).lineHeight));
    }
  },
};

/** A tablet (600px and wider): labels beside the icons inside a 40px pill, tabs grouped in the middle. */
export const Wide = {
  globals: { viewport: { value: 'tablet', isRotated: false } },
  play: async ({ canvas }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(600);
    const today = canvas.getByRole('link', { name: 'Today' });
    const pill = indicatorOf(today).getBoundingClientRect();
    const icon = today.querySelector('svg').getBoundingClientRect();
    const label = labelOf(today).getBoundingClientRect();
    await expect(pill.height).toBe(40);
    await expect(Math.round(icon.left - pill.left)).toBe(16);
    await expect(Math.round(pill.right - label.right)).toBe(16);
    await expect(Math.round(label.left - icon.right)).toBe(4);
    const barBox = bar(canvas).getBoundingClientRect();
    await expect(Math.abs(today.getBoundingClientRect().left - barBox.width * 0.15)).toBeLessThanOrEqual(1);
  },
};

/** A long page scrolled to the end: the last line sits above the bar, not behind it. */
export const LongPage = {
  render: () => (
    <>
      <div style={{ height: 2000 }}>Tall page content</div>
      <p>Last line of the page</p>
      <NavigationBar />
    </>
  ),
  play: async ({ canvas }) => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    const lastLine = canvas.getByText('Last line of the page').getBoundingClientRect();
    await expect(lastLine.bottom).toBeLessThanOrEqual(bar(canvas).getBoundingClientRect().top);
  },
};
