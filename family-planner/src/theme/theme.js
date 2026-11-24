/**
 * The MUI theme for the app and Storybook, styled as Material 3 Expressive.
 *
 * MUI reads every color from the token CSS variables (var(--schemes-…)) instead of fixed values,
 * so the `data-theme` themes (light, dark and the contrast variants) apply to MUI components too,
 * and a new token export from Figma updates them without touching this file.
 *
 * Besides MUI's own options, the theme adds:
 * - a `tertiary` palette color, and
 * - the M3 type scale as Typography variants: <Typography variant="titleMedium">.
 */
import { createTheme } from '@mui/material/styles';
import { avatarOverrides } from './components/avatar';
import { buttonOverrides } from './components/button';
import {
  cardActionAreaOverrides,
  cardActionsOverrides,
  cardContentOverrides,
  cardHeaderOverrides,
  cardOverrides,
} from './components/card';
import { checkboxOverrides } from './components/checkbox';
import { chipOverrides } from './components/chip';
import { fabOverrides } from './components/fab';
import { outlinedInputOverrides } from './components/textField';
import { scheme, stateLayer, typeRoles, typescale, typeVariant, withOpacity } from './m3';

const colorRole = (role) => ({ main: scheme(role), contrastText: scheme(`on-${role}`) });
const onSurface = (opacity) => withOpacity(scheme('on-surface'), opacity);

export const theme = createTheme({
  cssVariables: {
    // Lets MUI work with colors it can't parse (our CSS variables), using CSS color-mix().
    nativeColor: true,
    // MUI's own variables point at the token variables. Declaring them again on every
    // [data-theme] element makes them follow a theme set on part of the page, not just <html>.
    rootSelector: ':root, [data-theme]',
  },

  // MUI's own animations (the ripple, among others) stop when the device asks for reduced motion.
  motion: { reducedMotion: 'system' },

  palette: {
    primary: colorRole('primary'),
    secondary: colorRole('secondary'),
    tertiary: colorRole('tertiary'),
    error: colorRole('error'),
    background: {
      default: scheme('surface'),
      paper: scheme('surface-container-low'),
    },
    text: {
      primary: scheme('on-surface'),
      secondary: scheme('on-surface-variant'),
      disabled: onSurface(0.38),
    },
    divider: scheme('outline-variant'),
    action: {
      active: scheme('on-surface-variant'),
      hover: onSurface(stateLayer.hover),
      hoverOpacity: stateLayer.hover,
      selected: onSurface(stateLayer.pressed),
      focus: onSurface(stateLayer.focus),
      focusOpacity: stateLayer.focus,
      activatedOpacity: stateLayer.pressed,
      disabled: onSurface(0.38),
      disabledBackground: onSurface(0.12),
      disabledOpacity: 0.38,
    },
  },

  typography: {
    fontFamily: 'var(--font-families-roboto), system-ui, sans-serif',
    // MUI's own variants, mapped onto the M3 type scale.
    h1: typescale('display-large'),
    h2: typescale('display-medium'),
    h3: typescale('display-small'),
    h4: typescale('headline-large'),
    h5: typescale('headline-medium'),
    h6: typescale('headline-small'),
    subtitle1: typescale('title-medium'),
    subtitle2: typescale('title-small'),
    body1: typescale('body-large'),
    body2: typescale('body-medium'),
    caption: typescale('body-small'),
    overline: typescale('label-small'),
    button: { ...typescale('label-large'), textTransform: 'none' },
    // And the M3 names: displayLarge … labelSmall.
    ...Object.fromEntries(typeRoles.map((role) => [typeVariant(role), typescale(role)])),
  },

  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: Object.fromEntries(
          typeRoles.map((role) => {
            const element = { display: 'h1', headline: 'h2', title: 'h3', body: 'p', label: 'span' }[role.split('-')[0]];
            return [typeVariant(role), element];
          }),
        ),
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          // MUI's ripple peaks at 30% opacity. Scale it to M3's 10% pressed state layer.
          '& .MuiTouchRipple-root': { opacity: stateLayer.pressed / 0.3 },
        },
      },
    },
    MuiButton: buttonOverrides,
    MuiCard: cardOverrides,
    MuiCardContent: cardContentOverrides,
    MuiCardHeader: cardHeaderOverrides,
    MuiCardActions: cardActionsOverrides,
    MuiCardActionArea: cardActionAreaOverrides,
    MuiCheckbox: checkboxOverrides,
    MuiChip: chipOverrides,
    MuiFab: fabOverrides,
    MuiAvatar: avatarOverrides,
    MuiOutlinedInput: outlinedInputOverrides,
  },
});
