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

function startOfNextDay(date) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);
  return next;
}

const sameDay = (first, second) => startOfDay(first).getTime() === startOfDay(second).getTime();

/** "07:45": the 24-hour clock, as on the wireframe. */
export const clockTime = (date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

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

/**
 * The two sections of the Today page:
 * - `urgent`: urgent tasks (see isUrgent), overdue and soonest first, flagged ones without a date last;
 * - `schedule`: the day's other tasks and events, all-day events first, then in time order.
 * Done tasks stay in the schedule (crossed out); tasks without a date only show when urgent.
 */
export function planToday(items, now) {
  const urgent = items
    .filter((item) => isUrgent(item, now))
    .sort((first, second) =>
      (first.dueAt ?? Infinity) - (second.dueAt ?? Infinity) || byTitle(first, second));
  const schedule = items
    .filter((item) => !isUrgent(item, now) && isOnDay(item, now))
    .sort((first, second) => timeInDay(first, now) - timeInDay(second, now) || byTitle(first, second));
  return { urgent, schedule };
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
