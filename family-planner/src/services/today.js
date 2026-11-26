// The rules of the Today page: which items it shows, in which section and order, and how their
// times read. Plain functions of the loaded items and the time `now`, so they can be tested
// without a database or a browser (tests/today.test.js). The page's components only draw what
// these return.

/** A task due within this many hours (or overdue, or flagged) is urgent. */
export const URGENT_WITHIN_HOURS = 3;

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function startOfDay(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Midnight at the start of the day after `date`. */
export function startOfNextDay(date) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);
  return next;
}

const sameDay = (first, second) => startOfDay(first).getTime() === startOfDay(second).getTime();

const pad = (number) => String(number).padStart(2, "0");

/** "07:45": the 24-hour clock, as on the wireframe. */
export const clockTime = (date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** "Wed 21 Oct" */
export const dayLabel = (date) =>
  date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** "Mon 19 October", for the page header. */
export const fullDate = (date) =>
  date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });

/** True for an unfinished task that is flagged, overdue or due within URGENT_WITHIN_HOURS. */
export function isUrgent(item, now) {
  if (item.kind !== "task" || item.completed) return false;
  if (item.manuallyUrgent) return true;
  return Boolean(item.dueAt) && item.dueAt - now <= URGENT_WITHIN_HOURS * HOUR;
}

/** Why an urgent task is urgent: "Overdue", "Due in 45 min", "Due in 2 h" or "Flagged". */
export function urgencyLabel(task, now) {
  if (task.dueAt) {
    const left = task.dueAt - now;
    if (left < 0) return "Overdue";
    if (left < HOUR) return `Due in ${Math.max(1, Math.ceil(left / MINUTE))} min`;
    if (left <= URGENT_WITHIN_HOURS * HOUR) return `Due in ${Math.floor(left / HOUR)} h`;
  }
  return task.manuallyUrgent ? "Flagged" : null;
}

/** When a task is due: "12:00" today, "Wed 21 Oct" on another day, "" without a date. */
export function dueLabel(task, now) {
  if (!task.dueAt) return "";
  return sameDay(task.dueAt, now) ? clockTime(task.dueAt) : dayLabel(task.dueAt);
}

/** When a task that isn't urgent is due: "by 15:00" today, "Wed 21 Oct" on another day, "" without a date. */
export function deadlineLabel(task, now) {
  if (!task.dueAt) return "";
  return sameDay(task.dueAt, now) ? `by ${clockTime(task.dueAt)}` : dayLabel(task.dueAt);
}

/** Does the event take up the whole of the day that `now` is in? */
function allDayOn(event, now) {
  if (event.allDay) return true;
  return Boolean(event.endsAt) && event.startsAt < startOfDay(now) && event.endsAt >= startOfNextDay(now);
}

/**
 * The time column of an event on the day of `now`: { start: "07:45", end: "08:15" }. An event
 * that started on an earlier day reads "Until 01:00"; one that ends on a later day shows that
 * day ("Tue"); one that fills the day reads "All day". `end` is null when there's nothing to show.
 */
export function eventTimes(event, now) {
  if (allDayOn(event, now)) return { start: "All day", end: null };
  const dayStart = startOfDay(now);
  const nextDay = startOfNextDay(now);
  const start = event.startsAt < dayStart ? "Until" : clockTime(event.startsAt);
  let end = null;
  if (event.endsAt) {
    end = event.endsAt > nextDay
      ? event.endsAt.toLocaleDateString("en-GB", { weekday: "short" })
      : clockTime(event.endsAt);
  }
  return { start, end };
}

/** Is the item on the day of `now`: a task due that day, or an event that overlaps it? */
function isOnDay(item, now) {
  const dayStart = startOfDay(now);
  const nextDay = startOfNextDay(now);
  if (item.kind === "task") return Boolean(item.dueAt) && item.dueAt >= dayStart && item.dueAt < nextDay;
  if (!item.startsAt) return false;
  if (!item.endsAt) return item.startsAt >= dayStart && item.startsAt < nextDay;
  return item.startsAt < nextDay && item.endsAt > dayStart;
}

/** Where an item sits in the day: all-day events first, then by time. */
function timeInDay(item, now) {
  if (item.kind === "task") return item.dueAt.getTime();
  if (allDayOn(item, now)) return -Infinity;
  return Math.max(item.startsAt.getTime(), startOfDay(now).getTime());
}

const byTitle = (first, second) => first.title.localeCompare(second.title);

/** Soonest due first, tasks without a date last; the same due time by title. */
const byDue = (first, second) =>
  (first.dueAt ?? Infinity) - (second.dueAt ?? Infinity) || byTitle(first, second);

/** The family's events on the day of `day`: all-day events first, then in time order. */
function eventsOn(items, day) {
  return items
    .filter((item) => item.kind === "event" && isOnDay(item, day))
    .sort((first, second) => timeInDay(first, day) - timeInDay(second, day) || byTitle(first, second));
}

/**
 * The sections of the Today page, for the member `memberId` who is signed in:
 * - `urgent`: the whole family's urgent tasks (see isUrgent), overdue and soonest first, flagged
 *   ones without a date last;
 * - `mine`: the other tasks where `memberId` is responsible or attending, whatever the date. An
 *   adult also gets the tasks whose people all lack a login (a child without a phone, say), since
 *   nobody involved could see those on their own page;
 * - `unassigned`: the other tasks nobody is responsible for or attending;
 * - `eventsToday` and `eventsTomorrow`: the whole family's events on each day, all-day events
 *   first, then in time order. An event that runs over both days is in both.
 * `mine` and `unassigned` are soonest due first, tasks without a date last. Each task is in one
 * section at most: an urgent task is only under `urgent`, and a task only other members have a
 * role in isn't listed unless it's urgent. A done task stays (crossed out) if it's due today;
 * other done tasks are left out. `assignments` are { item, member, role } as from loadAssignments;
 * `members` are the family's members, as from loadMembers.
 */
export function planToday(items, assignments, members, memberId, now) {
  const withLogin = new Set(members.filter((member) => member.user).map((member) => member.id));
  const isAdult = members.some((member) => member.id === memberId && member.memberType === "adult");
  const itemsOf = (list) => new Set(list.map((assignment) => assignment.item));
  const assigned = itemsOf(assignments);
  const mineIds = itemsOf(assignments.filter((assignment) => assignment.member === memberId));
  // Tasks someone with a login is involved in, so it's on their page.
  const seen = itemsOf(assignments.filter((assignment) => withLogin.has(assignment.member)));
  const isMine = (task) => mineIds.has(task.id) || (isAdult && assigned.has(task.id) && !seen.has(task.id));
  const urgent = items.filter((item) => isUrgent(item, now)).sort(byDue);
  const listed = items.filter((item) =>
    item.kind === "task" && !isUrgent(item, now) && (!item.completed || isOnDay(item, now)));
  return {
    urgent,
    mine: listed.filter(isMine).sort(byDue),
    unassigned: listed.filter((task) => !assigned.has(task.id)).sort(byDue),
    eventsToday: eventsOn(items, now),
    eventsTomorrow: eventsOn(items, startOfNextDay(now)),
  };
}

/** "2026-10-19": the day of a date as the value of a date field, in local time. "" for no date. */
export function dateInput(date) {
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "15:00": the time of a date as the value of a time field. "" for no date. */
export const timeInput = (date) => (date ? clockTime(date) : "");

/**
 * Who is involved in an item, from its assignments: { [member id]: "responsible" | "attending" }.
 * Members who aren't involved are left out. One role each: someone stored with both is responsible.
 */
export function rolesOf(assignments) {
  const roles = {};
  for (const { member, role } of assignments) {
    if (role === "responsible" || !roles[member]) roles[member] = role;
  }
  return roles;
}

/** A date field's and a time field's values as a Date in local time, or null if they aren't valid. */
function dateAt(date, time) {
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

/**
 * The item dialog's fields as the values to save, or { error } saying what to fix.
 *
 * The fields are { kind, title, date, time, starts, ends, allDay, important, roles }: `date` as a
 * date field's value ("2026-10-19"), `time`, `starts` and `ends` as time fields' ("15:00"), and
 * `roles` as from rolesOf.
 * - A task is due on `date` at `time` (the end of the day without a time), or has no date.
 *   Gives { values: { kind, title, dueAt, manuallyUrgent, assignments } }.
 * - An event is on `date`, from `starts` to `ends` (no end without one), or all day.
 *   Gives { values: { kind, title, startsAt, endsAt, allDay, assignments } }.
 */
export function readItemForm({ kind, title, date, time, starts, ends, allDay, important, roles }) {
  if (!title.trim()) return { error: "Enter a title." };
  const assignments = Object.entries(roles).map(([member, role]) => ({ member, role }));
  const values = { kind, title: title.trim() };

  if (kind === "task") {
    const dueAt = date ? dateAt(date, time || "23:59") : null;
    if (date && !dueAt) return { error: "Enter a valid date and deadline." };
    return { values: { ...values, dueAt, manuallyUrgent: important, assignments } };
  }

  if (!date) return { error: "Pick the day of the event." };
  if (allDay) {
    const startsAt = dateAt(date, "00:00");
    if (!startsAt) return { error: "Enter a valid date." };
    return { values: { ...values, startsAt, endsAt: null, allDay: true, assignments } };
  }
  if (!starts) return { error: "Enter when the event starts." };
  const startsAt = dateAt(date, starts);
  const endsAt = ends ? dateAt(date, ends) : null;
  if (!startsAt || (ends && !endsAt)) return { error: "Enter a valid date and time." };
  if (endsAt && endsAt <= startsAt) return { error: "The event has to end after it starts." };
  return { values: { ...values, startsAt, endsAt, allDay: false, assignments } };
}

/** An item's people: { responsible: [members], attending: [members] }, each by name. */
export function peopleOf(itemId, assignments, members) {
  const byId = new Map(members.map((member) => [member.id, member]));
  const withRole = (role) =>
    assignments
      .filter((assignment) => assignment.item === itemId && assignment.role === role)
      .map((assignment) => byId.get(assignment.member))
      .filter(Boolean)
      .sort((first, second) => first.name.localeCompare(second.name));
  return { responsible: withRole("responsible"), attending: withRole("attending") };
}
