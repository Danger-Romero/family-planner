/**
 * Material 3 Expressive building blocks shared by the MUI theme (theme.js) and the component
 * styles in ./components.
 *
 * - Colors, type and elevation are our own design tokens: the CSS variables in tokens.css.
 * - Sizes, corners, state-layer opacities and motion are Google's published M3 values
 *   (Jetpack Compose `androidx.compose.material3.tokens`, token version 0.11).
 */

/** Project rule: every important touch target is at least 44×44 px. (M3 itself uses 48.) */
export const minTouchTarget = 44;

/** A color role from the Figma theme: scheme('on-primary') → 'var(--schemes-on-primary)'. */
export const scheme = (role) => `var(--schemes-${role})`;

/** A color at an opacity, e.g. withOpacity(scheme('on-surface'), 0.38) for disabled text. */
export const withOpacity = (color, opacity) =>
  `color-mix(in srgb, ${color} ${Math.round(opacity * 1000) / 10}%, transparent)`;

/** Opacity of the state layer M3 draws over a component while it is hovered, focused, etc. */
export const stateLayer = { hover: 0.08, focus: 0.1, pressed: 0.1, dragged: 0.16 };

/** The M3 corner scale, in px. "Full" (a pill or circle) is half the component's height. */
export const corner = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  extraLargeIncreased: 32,
  extraExtraLarge: 48,
};

/** M3 elevation level 0–5 as a box-shadow, using the elevation tokens. */
export const elevation = (level) => (level === 0 ? 'none' : `var(--m3-elevation-light-${level})`);

// ---------------------------------------------------------------------------------------------
// Typography

/** The M3 type scale. Each role is a group of variables in tokens.css (--material-theme-<role>-*). */
export const typeRoles = [
  'display-large',
  'display-medium',
  'display-small',
  'headline-large',
  'headline-medium',
  'headline-small',
  'title-large',
  'title-medium',
  'title-small',
  'body-large',
  'body-medium',
  'body-small',
  'label-large',
  'label-medium',
  'label-small',
];

/** 'title-medium' → 'titleMedium', the name of the matching MUI Typography variant. */
export const typeVariant = (role) => role.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());

/** The CSS for one role of the type scale (one of `typeRoles`), read from the typography tokens. */
export function typescale(role) {
  const token = (property) => `var(--material-theme-${role}-${property})`;
  return {
    fontFamily: `${token('font-family')}, system-ui, sans-serif`,
    fontWeight: token('font-weight'),
    fontSize: token('font-size'),
    lineHeight: token('line-height'),
    letterSpacing: token('letter-spacing'),
  };
}

// ---------------------------------------------------------------------------------------------
// Motion

/**
 * An M3 motion spring (mass 1). A damping ratio of 1 settles without bouncing.
 * @typedef {object} Spring
 * @property {number} damping
 * @property {number} stiffness
 */

/**
 * A spring as CSS.
 * @typedef {object} Motion
 * @property {number} duration How long the spring takes to settle, in ms.
 * @property {string} easing A CSS `linear()` easing that traces the spring's movement.
 */

/** The M3 Expressive motion scheme. "Spatial" springs move things, "effects" springs fade colors. */
export const springs = {
  fastSpatial: { damping: 0.6, stiffness: 800 },
  defaultSpatial: { damping: 0.8, stiffness: 380 },
  slowSpatial: { damping: 0.8, stiffness: 200 },
  fastEffects: { damping: 1, stiffness: 3800 },
  defaultEffects: { damping: 1, stiffness: 1600 },
  slowEffects: { damping: 1, stiffness: 800 },
};

/**
 * CSS can't run a spring, so this samples the spring's curve into a CSS `linear()` easing and
 * measures how long it takes to come to rest.
 * @param {Spring} spring
 * @returns {Motion}
 */
export function springToCss({ damping, stiffness }) {
  const omega = Math.sqrt(stiffness);
  const position = (t) => {
    if (damping >= 1) return 1 - (1 + omega * t) * Math.exp(-omega * t);
    const omegaD = omega * Math.sqrt(1 - damping * damping);
    const decay = Math.exp(-damping * omega * t);
    return 1 - decay * (Math.cos(omegaD * t) + ((damping * omega) / omegaD) * Math.sin(omegaD * t));
  };

  // At rest: within 0.1% of the target from then on.
  const step = 0.001;
  let settled = step;
  for (let t = 0; t < 3; t += step) {
    if (Math.abs(1 - position(t)) > 0.001) settled = t + step;
  }

  const samples = 32;
  const points = Array.from({ length: samples + 1 }, (_, i) =>
    i === samples ? 1 : Number(position((settled * i) / samples).toFixed(3)),
  );
  return { duration: Math.round(settled * 1000), easing: `linear(${points.join(', ')})` };
}

/** Every spring in `springs` as CSS, e.g. motion.defaultEffects → { duration, easing }. */
export const motion = Object.fromEntries(
  Object.entries(springs).map(([name, spring]) => [name, springToCss(spring)]),
);

/**
 * A CSS `transition` that animates the given properties with one of the M3 springs.
 * @param {string[]} properties
 * @param {Motion} motion
 */
export const transition = (properties, { duration, easing }) =>
  properties.map((property) => `${property} ${duration}ms ${easing}`).join(', ');
