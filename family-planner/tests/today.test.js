import assert from "node:assert/strict";
import test from "node:test";
import {
  clockTime, dateTimeInput, dayLabel, dueLabel, eventTimes, fullDate, isUrgent, peopleOf, planToday,
  readTaskForm, urgencyLabel,
} from "../src/services/today.js";

// Monday 19 October 2026, 10:00 local time.
const at = (hours, minutes = 0, day = 19) => new Date(2026, 9, day, hours, minutes);
const now = at(10);

const task = (id, values = {}) => ({
  id, kind: "task", title: id, completed: false, dueAt: null, startsAt: null, endsAt: null,
  allDay: false, manuallyUrgent: false, ...values,
});
const event = (id, startsAt, endsAt = null, values = {}) =>
  task(id, { kind: "event", startsAt, endsAt, ...values });

test("a task is urgent when flagged, overdue or due within 3 hours", () => {
  assert.equal(isUrgent(task("soon", { dueAt: at(12) }), now), true);
  assert.equal(isUrgent(task("three hours", { dueAt: at(13) }), now), true);
  assert.equal(isUrgent(task("later", { dueAt: at(13, 1) }), now), false);
  assert.equal(isUrgent(task("overdue", { dueAt: at(18, 0, 18) }), now), true);
  assert.equal(isUrgent(task("flagged", { dueAt: at(9, 0, 21), manuallyUrgent: true }), now), true);
  assert.equal(isUrgent(task("flagged, no date", { manuallyUrgent: true }), now), true);
  assert.equal(isUrgent(task("no date"), now), false);
  assert.equal(isUrgent(task("done", { dueAt: at(18, 0, 18), completed: true }), now), false);
  assert.equal(isUrgent(event("event soon", at(11)), now), false);
});

test("urgencyLabel says why a task is urgent", () => {
  assert.equal(urgencyLabel(task("a", { dueAt: at(9, 59) }), now), "Overdue");
  assert.equal(urgencyLabel(task("a", { dueAt: at(12) }), now), "Due in 2 h");
  assert.equal(urgencyLabel(task("a", { dueAt: at(12, 59) }), now), "Due in 2 h");
  assert.equal(urgencyLabel(task("a", { dueAt: at(10, 45) }), now), "Due in 45 min");
  assert.equal(urgencyLabel(task("a", { dueAt: new Date(now.getTime() + 20_000) }), now), "Due in 1 min");
  assert.equal(urgencyLabel(task("a", { dueAt: at(9, 0, 21), manuallyUrgent: true }), now), "Flagged");
  assert.equal(urgencyLabel(task("a", { manuallyUrgent: true }), now), "Flagged");
  // A deadline says more than the flag.
  assert.equal(urgencyLabel(task("a", { dueAt: at(11), manuallyUrgent: true }), now), "Due in 1 h");
  assert.equal(urgencyLabel(task("a", { dueAt: at(9), manuallyUrgent: true }), now), "Overdue");
});

test("dates and times read like the wireframe", () => {
  assert.equal(clockTime(at(7, 45)), "07:45");
  assert.equal(clockTime(at(19)), "19:00");
  assert.equal(dayLabel(at(9, 0, 21)), "Wed 21 Oct");
  assert.equal(fullDate(now), "Mon 19 October");
  assert.equal(dueLabel(task("a", { dueAt: at(12) }), now), "12:00");
  assert.equal(dueLabel(task("a", { dueAt: at(9, 0, 21) }), now), "Wed 21 Oct");
  assert.equal(dueLabel(task("a", { dueAt: at(18, 0, 18) }), now), "Sun 18 Oct");
  assert.equal(dueLabel(task("a"), now), "");
});

test("eventTimes fills the time column, also for events that cross midnight", () => {
  assert.deepEqual(eventTimes(event("a", at(7, 45), at(8, 15)), now), { start: "07:45", end: "08:15" });
  assert.deepEqual(eventTimes(event("a", at(18)), now), { start: "18:00", end: null });
  assert.deepEqual(eventTimes(event("a", at(0), at(0, 0, 20), { allDay: true }), now), { start: "All day", end: null });
  assert.deepEqual(eventTimes(event("a", at(22, 0, 18), at(1)), now), { start: "Until", end: "01:00" });
  assert.deepEqual(eventTimes(event("a", at(22), at(2, 0, 20)), now), { start: "22:00", end: "Tue" });
  assert.deepEqual(eventTimes(event("a", at(12, 0, 18), at(12, 0, 20)), now), { start: "All day", end: null });
});

test("planToday puts urgent tasks first and today's other items in time order", () => {
  const items = [
    task("sign up", { dueAt: at(12) }),
    task("pay", { dueAt: at(9, 0, 21), manuallyUrgent: true }),
    event("school run", at(7, 45), at(8, 15)),
    task("pack kit", { dueAt: at(15) }),
    event("football", at(15, 30), at(16, 30)),
    event("dentist", at(16), at(16, 45)),
    task("groceries", { dueAt: at(19) }),
    task("tomorrow", { dueAt: at(9, 0, 20) }),
    event("tomorrow's event", at(9, 0, 20)),
    task("done", { dueAt: at(9), completed: true }),
    event("yesterday", at(20, 0, 18), at(22, 0, 18)),
    event("ends at midnight", at(22, 0, 18), at(0)),
    event("night", at(22, 0, 18), at(1)),
    event("holiday", at(0), at(0, 0, 20), { allDay: true }),
    task("forgot", { dueAt: at(18, 0, 18) }),
    task("someday"),
    task("flagged someday", { manuallyUrgent: true }),
    task("old chore", { completed: true }),
  ];
  const plan = planToday(items, now);
  assert.deepEqual(plan.urgent.map((item) => item.id), ["forgot", "sign up", "pay", "flagged someday"]);
  assert.deepEqual(plan.schedule.map((item) => item.id),
    ["holiday", "night", "school run", "done", "pack kit", "football", "dentist", "groceries"]);
  // Unfinished tasks without a date: they have no day, so they're always on Today.
  assert.deepEqual(plan.anytime.map((item) => item.id), ["someday"]);
});

test("tasks without a date are listed under anytime, by title", () => {
  const plan = planToday([task("Water plants"), task("Fix bike light"), task("Done", { completed: true })], now);
  assert.deepEqual(plan.anytime.map((item) => item.id), ["Fix bike light", "Water plants"]);
  assert.deepEqual(plan.urgent, []);
  assert.deepEqual(plan.schedule, []);
});

test("items at the same time are in title order", () => {
  const plan = planToday([event("b", at(15), at(16)), task("a", { dueAt: at(15) })], now);
  assert.deepEqual(plan.schedule.map((item) => item.id), ["a", "b"]);
});

test("peopleOf splits an item's people into responsible and attending, by name", () => {
  const members = [{ id: "t", name: "Theo" }, { id: "e", name: "Ella" }, { id: "j", name: "Jonas" }];
  const assignments = [
    { item: "run", member: "j", role: "responsible" },
    { item: "run", member: "t", role: "attending" },
    { item: "run", member: "e", role: "attending" },
    { item: "run", member: "removed", role: "attending" },
    { item: "other", member: "e", role: "responsible" },
  ];
  assert.deepEqual(peopleOf("run", assignments, members), {
    responsible: [{ id: "j", name: "Jonas" }],
    attending: [{ id: "e", name: "Ella" }, { id: "t", name: "Theo" }],
  });
  assert.deepEqual(peopleOf("none", assignments, members), { responsible: [], attending: [] });
});

test("dateTimeInput gives a date as a datetime-local field's value, in local time", () => {
  assert.equal(dateTimeInput(at(15)), "2026-10-19T15:00");
  assert.equal(dateTimeInput(new Date(2026, 0, 5, 7, 5)), "2026-01-05T07:05");
  assert.equal(dateTimeInput(null), "");
});

test("readTaskForm turns the task dialog's fields into the values to save", () => {
  const assignments = [{ member: "ella", role: "responsible" }];
  assert.deepEqual(
    readTaskForm({ title: "  Pack football kit ", due: "2026-10-19T15:00", flagged: true, assignments }),
    { values: { title: "Pack football kit", dueAt: at(15), manuallyUrgent: true, assignments } },
  );
  // An empty due field means no date: the task goes under Anytime.
  assert.deepEqual(
    readTaskForm({ title: "Call the plumber", due: "", flagged: false, assignments: [] }),
    { values: { title: "Call the plumber", dueAt: null, manuallyUrgent: false, assignments: [] } },
  );
  assert.deepEqual(readTaskForm({ title: "  ", due: "", flagged: false, assignments: [] }), { error: "Enter a title." });
  assert.deepEqual(readTaskForm({ title: "a", due: "not a date", flagged: false, assignments: [] }), {
    error: "Enter a valid due date and time.",
  });
});
