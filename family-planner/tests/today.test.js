import assert from "node:assert/strict";
import test from "node:test";
import {
  clockTime, dateInput, dayLabel, deadlineLabel, dueLabel, eventTimes, fullDate, isUrgent, peopleOf, planToday,
  readItemForm, rolesOf, startOfNextDay, timeInput, urgencyLabel,
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

test("deadlineLabel says when a task that isn't urgent is due", () => {
  assert.equal(deadlineLabel(task("a", { dueAt: at(15) }), now), "by 15:00");
  assert.equal(deadlineLabel(task("a", { dueAt: at(9, 0, 21) }), now), "Wed 21 Oct");
  assert.equal(deadlineLabel(task("a", { dueAt: at(18, 0, 18), completed: true }), now), "Sun 18 Oct");
  assert.equal(deadlineLabel(task("a"), now), "");
});

test("startOfNextDay is tomorrow at midnight, and eventTimes reads events as seen on that day", () => {
  const tomorrow = startOfNextDay(now);
  assert.deepEqual(tomorrow, at(0, 0, 20));
  assert.deepEqual(eventTimes(event("a", at(8, 0, 20), at(9, 0, 20)), tomorrow), { start: "08:00", end: "09:00" });
  assert.deepEqual(eventTimes(event("a", at(22), at(2, 0, 20)), tomorrow), { start: "Until", end: "02:00" });
});

const assignment = (item, member, role = "responsible") => ({ item, member, role });
const ids = (section) => section.map((item) => item.id);

test("planToday splits the page into urgent, my tasks, not assigned, and events today and tomorrow", () => {
  const items = [
    task("mine later", { dueAt: at(9, 0, 21) }),
    task("mine today", { dueAt: at(15) }),
    task("mine someday"),
    task("mine done today", { dueAt: at(9), completed: true }),
    task("mine done earlier", { dueAt: at(9, 0, 18), completed: true }),
    task("mine done someday", { completed: true }),
    task("mine urgent", { dueAt: at(11) }),
    task("mor's", { dueAt: at(15) }),
    task("mor's overdue", { dueAt: at(18, 0, 18) }),
    task("nobody's", { dueAt: at(9, 0, 20) }),
    task("nobody's someday"),
    task("nobody's flagged", { manuallyUrgent: true }),
    event("holiday", at(0), at(0, 0, 20), { allDay: true }),
    event("school run", at(7, 45), at(8, 15)),
    event("football", at(15, 30), at(16, 30)),
    event("night out", at(22), at(2, 0, 20)),
    event("parents' meeting", at(8, 0, 20)),
    event("tomorrow all day", at(0, 0, 20), at(0, 0, 21), { allDay: true }),
    event("yesterday", at(20, 0, 18), at(22, 0, 18)),
    event("wednesday", at(9, 0, 21)),
  ];
  const assignments = [
    ...["mine later", "mine someday", "mine done today", "mine done earlier", "mine done someday", "mine urgent"]
      .map((id) => assignment(id, "me")),
    assignment("mine today", "me", "attending"),
    assignment("mor's", "mor"),
    assignment("mor's overdue", "mor"),
    assignment("football", "mor", "attending"),
  ];
  const plan = planToday(items, assignments, "me", now);
  // Everyone's urgent tasks, overdue and soonest first, flagged ones without a date last.
  assert.deepEqual(ids(plan.urgent), ["mor's overdue", "mine urgent", "nobody's flagged"]);
  // Responsible or attending, any date; done only if due today; by due time, undated last.
  assert.deepEqual(ids(plan.mine), ["mine done today", "mine today", "mine later", "mine someday"]);
  assert.deepEqual(ids(plan.unassigned), ["nobody's", "nobody's someday"]);
  // The whole family's events, all-day first, then by time on that day.
  assert.deepEqual(ids(plan.eventsToday), ["holiday", "school run", "football", "night out"]);
  assert.deepEqual(ids(plan.eventsTomorrow), ["tomorrow all day", "night out", "parents' meeting"]);
});

test("items at the same time are in title order", () => {
  const items = [task("b", { dueAt: at(15) }), task("a", { dueAt: at(15) }), event("d", at(15), at(16)), event("c", at(15))];
  const plan = planToday(items, [assignment("a", "me"), assignment("b", "me")], "me", now);
  assert.deepEqual(ids(plan.mine), ["a", "b"]);
  assert.deepEqual(ids(plan.eventsToday), ["c", "d"]);
});

test("without a signed-in member, my tasks is empty and the rest is unchanged", () => {
  const plan = planToday([task("a", { dueAt: at(15) }), task("b")], [assignment("a", "me")], undefined, now);
  assert.deepEqual(plan.mine, []);
  assert.deepEqual(ids(plan.unassigned), ["b"]);
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

test("dateInput and timeInput give a date as a date field's and a time field's value, in local time", () => {
  assert.equal(dateInput(at(15)), "2026-10-19");
  assert.equal(dateInput(new Date(2026, 0, 5, 7, 5)), "2026-01-05");
  assert.equal(timeInput(new Date(2026, 0, 5, 7, 5)), "07:05");
  assert.equal(dateInput(null), "");
  assert.equal(timeInput(null), "");
});

test("rolesOf gives each involved member one role, responsible if they have both", () => {
  const pair = (member, role) => ({ id: `${member}-${role}`, item: "kit", member, role });
  assert.deepEqual(
    rolesOf([pair("ella", "attending"), pair("ella", "responsible"), pair("anna", "responsible"), pair("theo", "attending")]),
    { ella: "responsible", anna: "responsible", theo: "attending" },
  );
  assert.deepEqual(rolesOf([]), {});
});

const form = (fields) => ({
  kind: "task", title: "Pack football kit", date: "", time: "", starts: "", ends: "", allDay: false,
  important: false, roles: {}, ...fields,
});

test("readItemForm turns a task's fields into the values to save", () => {
  assert.deepEqual(
    readItemForm(form({ title: "  Pack football kit ", date: "2026-10-19", time: "15:00", important: true, roles: { ella: "responsible", theo: "attending" } })),
    {
      values: {
        kind: "task", title: "Pack football kit", dueAt: at(15), manuallyUrgent: true,
        assignments: [{ member: "ella", role: "responsible" }, { member: "theo", role: "attending" }],
      },
    },
  );
  // Without a time, it's due at the end of the day; without a date, it goes under Anytime.
  assert.deepEqual(readItemForm(form({ date: "2026-10-19" })).values.dueAt, at(23, 59));
  assert.equal(readItemForm(form({ time: "15:00" })).values.dueAt, null);
  // Event fields don't count for a task.
  assert.equal(readItemForm(form({ starts: "15:00", allDay: true })).values.startsAt, undefined);
  assert.deepEqual(readItemForm(form({ title: "  " })), { error: "Enter a title." });
  assert.deepEqual(readItemForm(form({ date: "2026-10-19", time: "25:00" })), { error: "Enter a valid date and deadline." });
});

test("readItemForm turns an event's fields into the values to save", () => {
  const event = (fields) => readItemForm(form({ kind: "event", title: "Football practice", ...fields }));
  assert.deepEqual(event({ date: "2026-10-19", starts: "15:30", ends: "16:30", important: true }), {
    values: { kind: "event", title: "Football practice", startsAt: at(15, 30), endsAt: at(16, 30), allDay: false, assignments: [] },
  });
  assert.equal(event({ date: "2026-10-19", starts: "15:30" }).values.endsAt, null);
  // All day: from the start of the day, and the times don't count.
  assert.deepEqual(event({ date: "2026-10-21", starts: "15:30", ends: "09:00", allDay: true }).values, {
    kind: "event", title: "Football practice", startsAt: at(0, 0, 21), endsAt: null, allDay: true, assignments: [],
  });
  assert.deepEqual(event({ starts: "15:30" }), { error: "Pick the day of the event." });
  assert.deepEqual(event({ date: "2026-10-19" }), { error: "Enter when the event starts." });
  assert.deepEqual(event({ date: "2026-10-19", starts: "15:30", ends: "15:30" }), { error: "The event has to end after it starts." });
  assert.deepEqual(event({ date: "2026-10-19", starts: "15:30", ends: "99:00" }), { error: "Enter a valid date and time." });
});
