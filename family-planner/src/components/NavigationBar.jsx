/**
 * The app's main navigation: MUI's BottomNavigation styled as the Material 3 Expressive
 * navigation bar.
 *
 * Sizes and colors are Google's published M3 values (Jetpack Compose `NavigationBarTokens`,
 * `NavigationBarVerticalItemTokens`, `NavigationBarHorizontalItemTokens`, `ShortNavigationBar`).
 * Below 600px the label sits under the icon; from 600px it sits beside the icon, inside the pill.
 */
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import FamilyRestroom from '@mui/icons-material/FamilyRestroom';
import FamilyRestroomOutlined from '@mui/icons-material/FamilyRestroomOutlined';
import Today from '@mui/icons-material/Today';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import ViewWeek from '@mui/icons-material/ViewWeek';
import ViewWeekOutlined from '@mui/icons-material/ViewWeekOutlined';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { styled } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';
import { motion, scheme, stateLayer, transition, typescale } from '../theme/m3';

const destinations = [
  { value: 'today', label: 'Today', to: '/', icon: TodayOutlined, selectedIcon: Today },
  { value: 'calendar', label: 'Calendar', to: '/calendar', icon: CalendarMonthOutlined, selectedIcon: CalendarMonth },
  { value: 'plan-week', label: 'Plan Week', to: '/plan-week', icon: ViewWeekOutlined, selectedIcon: ViewWeek },
  { value: 'family', label: 'Family', to: '/family', icon: FamilyRestroomOutlined, selectedIcon: FamilyRestroom },
];

/** The tab to highlight for a route, or null when the route isn't one of the tabs. */
function destinationForPath(pathname) {
  // Only the first part of the path counts: '/family/' and '/calendar/2026' match their tab.
  const section = `/${pathname.split('/')[1]}`;
  // Items will become part of Today.
  if (section === '/items') return 'today';
  return destinations.find(({ to }) => to === section)?.value ?? null;
}

/**
 * M3: the bar is 64px high, plus the phone's safe area (e.g. the iPhone home indicator). Exported
 * for things placed above the bar, like the Today page's "+".
 */
export const barHeight = 64;

// Keeps the end of the page clear of the fixed bar.
const Spacer = styled('div')({
  height: `calc(${barHeight}px + env(safe-area-inset-bottom))`,
});

const Bar = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: theme.zIndex.appBar,
  boxSizing: 'content-box',
  height: 'auto',
  minHeight: barHeight,
  paddingBottom: 'env(safe-area-inset-bottom)',
  backgroundColor: scheme('surface-container'),
}));

const indicator = '& .NavigationBar-indicator';
const label = '& .MuiBottomNavigationAction-label';
const noMotion = { '@media (prefers-reduced-motion: reduce)': { transition: 'none' } };

// The icon, the pill behind it (the "active indicator") and the label are laid out on a grid.
const Item = styled(BottomNavigationAction)(({ theme }) => ({
  // Undo MUI's Material 2 layout.
  flex: 1,
  minWidth: 0,
  maxWidth: 'none',
  padding: 0,

  display: 'grid',
  placeContent: 'center',
  // Below 600px: the pill (56×32) with the icon in it, and the label underneath.
  gridTemplateAreas: '"icon" "label"',
  gridTemplateRows: '32px auto',
  rowGap: 4,
  paddingBlock: 6,

  // The icon color. The state layer uses it too.
  color: scheme('on-surface-variant'),
  transition: transition(['color'], motion.defaultEffects),
  ...noMotion,

  [indicator]: {
    gridArea: 'icon',
    justifySelf: 'center',
    width: 56,
    height: 32,
    position: 'relative',
    borderRadius: 9999,

    // ::before is the pill's fill, which grows out from the center when the tab is selected.
    // ::after is the state layer for hover, focus and press.
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
    },
    '&::before': {
      backgroundColor: scheme('secondary-container'),
      transform: 'scaleX(0)',
      transition: transition(['transform'], motion.defaultSpatial),
      ...noMotion,
    },
    '&::after': {
      backgroundColor: 'currentColor',
      opacity: 'var(--nav-state, 0)',
      transition: transition(['opacity'], motion.defaultEffects),
      ...noMotion,
    },
  },

  '& svg': {
    gridArea: 'icon',
    placeSelf: 'center',
    fontSize: 24,
    position: 'relative',
  },

  // MUI makes the selected label bigger; M3 keeps one size.
  [`${label}, ${label}.Mui-selected`]: {
    gridArea: 'label',
    justifySelf: 'center',
    position: 'relative',
    whiteSpace: 'nowrap',
    opacity: 1,
    ...typescale('label-medium'),
    transition: transition(['color'], motion.defaultEffects),
    transitionDelay: '0s',
    ...noMotion,
  },

  '&.Mui-selected': {
    color: scheme('on-secondary-container'),
    [`${indicator}::before`]: { transform: 'scaleX(1)' },
    [label]: { color: scheme('secondary') },
  },

  // State layers. Hover only on devices that can hover, so it doesn't stick after a tap.
  '@media (hover: hover)': {
    '&:hover': { '--nav-state': stateLayer.hover },
  },
  '&.Mui-focusVisible': {
    '--nav-state': stateLayer.focus,
    [indicator]: { outline: `3px solid ${scheme('secondary')}`, outlineOffset: 2 },
  },
  '&:active': { '--nav-state': stateLayer.pressed },

  // 600px and up: the label moves beside the icon, inside a 40px pill with 16px at each end.
  // The tabs group in the middle: each takes at least 17.5% of the bar (4 × 17.5% = the middle
  // 70%) and grows if its label needs more room.
  [theme.breakpoints.up('sm')]: {
    flex: '0 0 auto',
    minWidth: '17.5%',
    gridTemplateAreas: '". icon . label ."',
    gridTemplateColumns: '16px 24px 4px auto 16px',
    gridTemplateRows: '40px',
    rowGap: 0,
    paddingBlock: 0,
    [indicator]: {
      gridArea: '1 / 1 / 2 / -1',
      justifySelf: 'stretch',
      width: 'auto',
      height: 40,
    },
    '&.Mui-selected': {
      [label]: { color: 'inherit' },
    },
  },
}));

export default function NavigationBar() {
  const { pathname } = useLocation();
  const selected = destinationForPath(pathname);

  return (
    <>
      <Spacer aria-hidden="true" />
      <Bar component="nav" aria-label="Main navigation" showLabels value={selected ?? false}>
        {destinations.map(({ value, label, to, icon: Icon, selectedIcon: SelectedIcon }) => (
          <Item
            key={value}
            component={Link}
            to={to}
            value={value}
            label={label}
            disableRipple
            aria-current={value === selected ? 'page' : undefined}
            icon={
              <>
                <span className="NavigationBar-indicator" aria-hidden="true" />
                {value === selected ? <SelectedIcon /> : <Icon />}
              </>
            }
          />
        ))}
      </Bar>
    </>
  );
}
