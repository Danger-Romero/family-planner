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
