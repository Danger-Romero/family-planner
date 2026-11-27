const MINUTE = 60_000;
const DEFAULT_DURATION = 30 * MINUTE;

/** The calendar gives an event without an end time a 30-minute slot. */
export function calendarEventEnd(start, end) {
  return end == null
    ? new Date(new Date(start).getTime() + DEFAULT_DURATION)
    : new Date(end);
}

/**
 * Lay out one member's timed events on a local day, without changing the input.
 * Events use the calendar's { start, end, allDay } model; dates may be Dates or ISO strings.
 * Each result contains the original event, topMinutes, durationMinutes, lane and laneCount.
 * Overlap groups share a lane count; touching events can reuse a lane.
 */
export function layoutDayEvents(events, selectedDate) {
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const intervals = [];
  for (const event of events) {
    if (event.allDay || event.start == null) continue;

    const start = new Date(event.start).getTime();
    const end = calendarEventEnd(event.start, event.end).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;

    const clippedStart = Math.max(start, dayStart.getTime());
    const clippedEnd = Math.min(end, dayEnd.getTime());
    if (clippedEnd <= clippedStart) continue;

    intervals.push({ event, start: clippedStart, end: clippedEnd });
  }

  intervals.sort((first, second) =>
    first.start - second.start || second.end - first.end ||
    String(first.event.id).localeCompare(String(second.event.id)),
  );

  const groups = [];
  for (const interval of intervals) {
    const group = groups.at(-1);
    if (!group || interval.start >= group.end) {
      groups.push({ end: interval.end, intervals: [interval] });
    } else {
      group.intervals.push(interval);
      group.end = Math.max(group.end, interval.end);
    }
  }

  return groups.flatMap((group) => {
    const laneEnds = [];
    const placed = group.intervals.map(({ event, start, end }) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = end;

      return {
        event,
        topMinutes: (start - dayStart.getTime()) / MINUTE,
        durationMinutes: (end - start) / MINUTE,
        lane,
      };
    });

    return placed.map((event) => ({ ...event, laneCount: laneEnds.length }));
  });
}
