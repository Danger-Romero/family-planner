import { expect } from 'storybook/test';
import App from './App';

const meta = {
  component: App,
  tags: ['ai-generated'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// Interaction: the counter button keeps local state and re-renders its label on click.
export const Default = {
  play: async ({ canvas, userEvent }) => {
    const counter = canvas.getByRole('button', { name: /count is 0/i });
    await userEvent.click(counter);
    await userEvent.click(counter);
    await expect(counter).toHaveTextContent('Count is 2');
  },
};

// Below the 1024px breakpoint App.css stacks #next-steps vertically and centers the link grid.
export const Mobile = {
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
};

// Proves the shared preview loaded src/index.css (and App.css via the component import).
// Both values are independent of viewport width and light/dark color scheme.
export const CssCheck = {
  play: async ({ canvas }) => {
    // index.css: `h1, h2 { font-weight: 500 }` — the browser default for h1 is 700.
    const heading = canvas.getByRole('heading', { level: 1, name: /get started/i });
    await expect(getComputedStyle(heading).fontWeight).toBe('500');

    // index.css: `.counter { font-family: var(--mono) }` with --mono: ui-monospace, Consolas, monospace.
    // Asserting the resolved stack also proves the :root custom properties are defined.
    const counter = canvas.getByRole('button', { name: /count is/i });
    await expect(getComputedStyle(counter).fontFamily).toBe('ui-monospace, Consolas, monospace');

    // App.css: `.counter { border-radius: 5px }` overrides index.css's 4px.
    await expect(getComputedStyle(counter).borderRadius).toBe('5px');
  },
};
