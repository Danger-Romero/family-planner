/** Helpers shared by the component stories' play tests. */

/** The computed `property` of `value` (e.g. a var(--…)) as it resolves inside `scope`. */
export function resolve(scope, property, value) {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  scope.append(probe);
  const result = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return result;
}

let canvas;
/**
 * `color` as [r, g, b, a] (0–255), read back from a 1×1 canvas. Colors compare equal however the
 * browser serialized them: a color-mix() computes to color(srgb …), a plain token to rgb().
 */
export function rgba(color) {
  canvas ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.clearRect(0, 0, 1, 1);
  // A color the canvas can't parse leaves fillStyle as it was: catch that instead of comparing it.
  context.fillStyle = '#010203';
  context.fillStyle = color;
  if (context.fillStyle === '#010203') throw new Error(`rgba(): can't parse "${color}"`);
  context.fillRect(0, 0, 1, 1);
  return [...context.getImageData(0, 0, 1, 1).data];
}
