import assert from "node:assert/strict";
import test from "node:test";
import { avatarIcons, initialOf, isAvatarIcon } from "../src/services/avatars.js";

test("avatarIcons lists the 12 icons in order", () => {
  assert.deepEqual(avatarIcons.map((icon) => icon.name),
    ["pets", "star", "heart", "football", "music", "flower", "rocket", "sun", "bike", "palette", "book", "games"]);
  assert.deepEqual(avatarIcons.map((icon) => icon.label),
    ["Paw", "Star", "Heart", "Football", "Music", "Flower", "Rocket", "Sun", "Bike", "Paint palette", "Book", "Games"]);
});

test("isAvatarIcon accepts only listed names", () => {
  assert.equal(isAvatarIcon("pets"), true);
  for (const other of ["Pets", "", undefined, null, "dragon", "toString"]) {
    assert.equal(isAvatarIcon(other), false, String(other));
  }
});

test("initialOf gives the capital first letter, or ? when blank", () => {
  assert.equal(initialOf("Anna"), "A");
  assert.equal(initialOf("øjvind"), "Ø");
  assert.equal(initialOf("  émile"), "É");
  assert.equal(initialOf("   "), "?");
  assert.equal(initialOf(undefined), "?");
});
