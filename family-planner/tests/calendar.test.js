import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { calendarEventEnd, layoutDayEvents } from "../src/services/calendar.js";

const at = (hour, minute = 0, day = 26) =>
  new Date(2026, 10, day, hour, minute);
const selectedDate = at(12);
const event = (id, start, end = null, extra = {}) => ({
  id,
  title: id,
  start: start.toISOString(),
  end: end?.toISOString() ?? null,
  allDay: false,
  ...extra,
});
const placements = (events) =>
  layoutDayEvents(events, selectedDate).map(
    ({ event: placed, ...position }) => ({ id: placed.id, ...position }),
  );

test("timed events use start and duration, and adjacent events get the full width", () => {
  assert.deepEqual(
    placements([event("later", at(10), at(11)), event("first", at(9), at(10))]),
    [
      {
        id: "first",
        topMinutes: 540,
        durationMinutes: 60,
        lane: 0,
        laneCount: 1,
      },
      {
        id: "later",
        topMinutes: 600,
        durationMinutes: 60,
        lane: 0,
        laneCount: 1,
      },
    ],
  );
});

test("missing ends get 30 minutes before clipping to either side of midnight", () => {
  assert.equal(
    calendarEventEnd(at(9, 45), null).getTime(),
    at(10, 15).getTime(),
  );
  assert.deepEqual(
    placements([
      event("incoming", at(23, 50, 25)),
      event("outgoing", at(23, 50)),
    ]),
    [
      {
        id: "incoming",
        topMinutes: 0,
        durationMinutes: 20,
        lane: 0,
        laneCount: 1,
      },
      {
        id: "outgoing",
        topMinutes: 1430,
        durationMinutes: 10,
        lane: 0,
        laneCount: 1,
      },
    ],
  );
});

test("events spanning the selected day are clipped to its boundaries", () => {
  assert.deepEqual(
    placements([event("spanning", at(20, 0, 25), at(4, 0, 27))]),
    [
      {
        id: "spanning",
        topMinutes: 0,
        durationMinutes: 1440,
        lane: 0,
        laneCount: 1,
      },
    ],
  );
});

test("all-day, outside, invalid and non-positive intervals do not enter the timed layout", () => {
  assert.deepEqual(
    placements([
      event("all-day", at(0), null, { allDay: true }),
      event("before", at(22, 0, 25), at(0)),
      event("after", at(0, 0, 27), at(1, 0, 27)),
      event("empty", at(9), at(9)),
      event("reversed", at(10), at(9)),
      { id: "invalid-start", start: "invalid" },
      { id: "invalid-end", start: at(9), end: "invalid" },
      { id: "missing-start", start: null },
    ]),
    [],
  );
  assert.deepEqual(placements([]), []);
});

test("nested overlaps reuse free lanes and a later group gets the full width", () => {
  assert.deepEqual(
    placements([
      event("long", at(9), at(12)),
      event("short", at(9), at(10)),
      event("reuse", at(10), at(11)),
      event("later", at(12), at(13)),
    ]),
    [
      {
        id: "long",
        topMinutes: 540,
        durationMinutes: 180,
        lane: 0,
        laneCount: 2,
      },
      {
        id: "short",
        topMinutes: 540,
        durationMinutes: 60,
        lane: 1,
        laneCount: 2,
      },
      {
        id: "reuse",
        topMinutes: 600,
        durationMinutes: 60,
        lane: 1,
        laneCount: 2,
      },
      {
        id: "later",
        topMinutes: 720,
        durationMinutes: 60,
        lane: 0,
        laneCount: 1,
      },
    ],
  );
});

test("chained overlaps share one lane count even when the first and last only touch", () => {
  assert.deepEqual(
    placements([
      event("a", at(9), at(10)),
      event("b", at(9, 30), at(10, 30)),
      event("c", at(10), at(11)),
    ]).map(({ id, lane, laneCount }) => [id, lane, laneCount]),
    [
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 2],
    ],
  );
});

test("simultaneous events use separate lanes with a stable order", () => {
  const events = ["c", "a", "b"].map((id) => event(id, at(9), at(10)));
  assert.deepEqual(
    placements(events).map(({ id, lane, laneCount }) => [id, lane, laneCount]),
    [
      ["a", 0, 3],
      ["b", 1, 3],
      ["c", 2, 3],
    ],
  );
  assert.deepEqual(placements(events), placements([...events].reverse()));
});

test("layout and end-time fallback preserve the original data and selected date", () => {
  const start = at(9);
  const end = at(10);
  const originalDate = selectedDate.getTime();
  const source = Object.freeze({ id: "source", title: "Source", start, end });
  const events = Object.freeze([source]);
  const result = layoutDayEvents(events, selectedDate);
  assert.equal(result[0].event, source);
  assert.equal(start.getTime(), at(9).getTime());
  assert.equal(end.getTime(), at(10).getTime());
  assert.equal(selectedDate.getTime(), originalDate);
  assert.equal(calendarEventEnd(start, end).getTime(), end.getTime());
  assert.notEqual(calendarEventEnd(start, end), end);
});

test("Copenhagen daylight-saving days and repeated clock times use elapsed minutes", () => {
  const helperUrl = new URL("../src/services/calendar.js", import.meta.url)
    .href;
  // Run in a separate timezone-specific process so the test also works on UTC machines.
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from 'node:assert/strict';
    import { layoutDayEvents } from ${JSON.stringify(helperUrl)};
    for (const [month, day, minutes] of [[2, 29, 1380], [9, 25, 1500]]) {
      const selected = new Date(2026, month, day, 12);
      const [placed] = layoutDayEvents([{
        id: 'dst', start: new Date(2026, month, day - 1, 20), end: new Date(2026, month, day + 1, 4),
      }], selected);
      assert.equal(placed.topMinutes, 0);
      assert.equal(placed.durationMinutes, minutes);
    }
    const repeated = layoutDayEvents([
      { id: 'first', start: '2026-10-25T02:30:00+02:00', end: '2026-10-25T02:45:00+02:00' },
      { id: 'second', start: '2026-10-25T02:30:00+01:00', end: '2026-10-25T02:45:00+01:00' },
    ], new Date(2026, 9, 25));
    assert.deepEqual(repeated.map(e => [e.topMinutes, e.durationMinutes, e.laneCount]), [[150, 15, 1], [210, 15, 1]]);
  `,
    ],
    { env: { ...process.env, TZ: "Europe/Copenhagen" } },
  );
});
