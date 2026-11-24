/**
 * MUI's outlined TextField, with the colours from our tokens. Only the colours so far: it is not
 * yet the M3 text field (shape, sizes and type are still MUI's).
 *
 * MUI draws the outline in black or white at 23% depending on the palette's mode. Our palette is
 * always "light" (the tokens switch the themes, not MUI), so in the dark themes the outline was
 * almost invisible. At rest it is now `outline`, as in M3. Hover (`on-surface`), focus (`primary`),
 * error and disabled already come from the palette.
 *
 * In the dark themes the browser's own date and time pickers (`type="datetime-local"`) are dark too.
 */
import { scheme } from '../m3';

/** The `MuiOutlinedInput` entry of the theme's `components` (see theme.js). */
export const outlinedInputOverrides = {
  styleOverrides: {
    root: {
      '[data-theme^="dark"] &': { colorScheme: 'dark' },
    },
    // One class: MUI's hover, focus, error and disabled rules (two classes) still win.
    notchedOutline: { borderColor: scheme('outline') },
  },
};
