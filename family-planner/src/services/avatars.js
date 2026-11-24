// What a member's avatar can show: one of these icons, or the first letter of their name.
// Plain data, so the services (and their tests) can use it without React. The icons themselves
// are in src/components/avatarIconComponents.js, under the same names.

/** The icons a member can choose, in the order the picker shows them. `label` is the spoken name. */
export const avatarIcons = [
  { name: "pets", label: "Paw" },
  { name: "star", label: "Star" },
  { name: "heart", label: "Heart" },
  { name: "football", label: "Football" },
  { name: "music", label: "Music" },
  { name: "flower", label: "Flower" },
  { name: "rocket", label: "Rocket" },
  { name: "sun", label: "Sun" },
  { name: "bike", label: "Bike" },
  { name: "palette", label: "Paint palette" },
  { name: "book", label: "Book" },
  { name: "games", label: "Games" },
];

/** True when `name` is one of the icons above (stored in Member.avatarIcon). */
export const isAvatarIcon = (name) => avatarIcons.some((icon) => icon.name === name);

/** The first letter of a name, in capitals ("øjvind" → "Ø"), or "?" when there's no name. */
export function initialOf(name) {
  const [first] = [...(name ?? "").trim()];
  return first ? first.toLocaleUpperCase() : "?";
}
