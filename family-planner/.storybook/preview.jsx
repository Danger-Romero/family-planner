import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { defaultThemeId, themes } from '../src/tokens/generated/tokens.ts';
import { theme } from '../src/theme';

// Same global stylesheets the app loads in src/main.jsx.
// tokens.css: design tokens from Figma, committed in src/tokens/generated/ (regenerate with `npm run tokens`).
import '../src/tokens/generated/tokens.css';
import '../src/index.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  decorators: [
    // Every story is drawn with the MUI theme (src/theme) on the theme's surface color.
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* index.css gives <html> a white background; fill the whole canvas with the surface color. */}
        <GlobalStyles styles={{ ':root': { background: 'var(--schemes-surface)' } }} />
        <Story />
      </ThemeProvider>
    ),
    // Toolbar dropdown that switches between the Figma themes by setting <html data-theme="…">.
    withThemeByDataAttribute({
      themes: Object.fromEntries(themes.map(({ name, id }) => [name, id])),
      defaultTheme: themes.find(({ id }) => id === defaultThemeId).name,
      attributeName: 'data-theme',
    }),
  ],

  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    }
  },
};

export default preview;
