import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Item from "../components/Item.jsx";
import MemberCalendar from "../components/MemberCalendar.jsx";
import { loadItems } from "../services/itemService.js";
import { loadMembers } from "../services/memberService.js";
import { loadAssignments } from "../services/assignmentService.js";

export default function CalendarPage({ family }) {
  const [days] = useState(() =>
    Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      return date;
    }),
  );

  function isOnDate(item, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    if (item.kind === "task") {
      return Boolean(item.dueAt && item.dueAt >= start && item.dueAt < end);
    }

    if (item.kind === "event" && item.startsAt) {
      if (!item.endsAt) {
        return item.startsAt >= start && item.startsAt < end;
      }

      return item.startsAt < end && item.endsAt > start;
    }

    return false;
  }

  const [selectedDate, setSelectedDate] = useState(() => days[0]);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [loadedItems, loadedMembers] = await Promise.all([
          loadItems(family),
          loadMembers(family),
        ]);

        const loadedAssignments = await loadAssignments(loadedItems);

        if (active) {
          setItems(loadedItems);
          setMembers(loadedMembers);
          setAssignments(loadedAssignments);
        }
      } catch (error) {
        if (active) {
          setError(error.message || "Could not load the calendar.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [family, reload]);

  const visibleItems = items
    .filter((item) => isOnDate(item, selectedDate))
    .sort((first, second) => {
      const firstDate = first.kind === "task" ? first.dueAt : first.startsAt;

      const secondDate =
        second.kind === "task" ? second.dueAt : second.startsAt;

      return firstDate - secondDate;
    });

  const calendarEvents = visibleItems
    .filter((item) => item.kind === "event")
    .map((item) => ({
      id: item.id,
      title: item.title,
      start: item.startsAt.toISOString(),
      end: (item.endsAt ?? new Date(item.startsAt.getTime() + 30 * 60 * 1000)) //Events without an end time gets a 30 minute slot
        .toISOString(),
      allDay: item.allDay,
    }));

  const memberCalendars = members.map((member) => ({
    member,
    events: calendarEvents.filter((event) =>
      assignments.some(
        //prevents duplicates if a member is both responsible and attending
        (assignment) =>
          assignment.item === event.id && assignment.member === member.id,
      ),
    ),
  }));

  const visibleTasks = visibleItems.filter((item) => item.kind === "task");

  return (
    <>
      <h1>Calendar</h1>

      <Box
        role="group"
        aria-label="Choose a date"
        sx={{ display: "flex", gap: 1, overflowX: "auto", p: 1 }}
      >
        {days.map((date, index) => {
          const selected = date.getTime() === selectedDate.getTime();

          return (
            <Button
              key={date.getTime()}
              type="button"
              shape="square"
              variant={selected ? "contained" : "outlined"}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString(undefined, {
                dateStyle: "full",
              })}
              onClick={() => setSelectedDate(date)}
              sx={{
                flexDirection: "column",
                flex: "1 0 80px",
                minHeight: 80,
              }}
            >
              <span>
                {index === 0
                  ? "Today"
                  : date.toLocaleDateString(undefined, {
                      weekday: "short",
                    })}
              </span>

              <span>
                {date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </Button>
          );
        })}
      </Box>

      <h2>
        {selectedDate.toLocaleDateString(undefined, {
          dateStyle: "full",
        })}
      </h2>

      {loading ? (
        <p role="status">Loading the calendar...</p>
      ) : error ? (
        <>
          <p role="alert">{error}</p>
          <Button
            type="button"
            variant="outlined"
            onClick={() => setReload((current) => current + 1)}
          >
            Try again
          </Button>
        </>
      ) : (
        <>
          <section>
            <h3>Events</h3>

            <Box
              sx={{
                display: "grid",
                gap: 0.5,
                gridTemplateColumns: `repeat(${Math.max(memberCalendars.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {memberCalendars.map(({ member, events }) => (
                <MemberCalendar
                  key={member.id}
                  member={member}
                  events={events}
                  selectedDate={selectedDate}
                />
              ))}
            </Box>

            {memberCalendars.length === 0 && (
              <p>No assigned events for this date.</p>
            )}
          </section>

          <section>
            <h3>Tasks</h3>

            {visibleTasks.length === 0 ? (
              <p>No tasks for this date.</p>
            ) : (
              <ul>
                {visibleTasks.map((item) => (
                  <Item
                    key={item.id}
                    item={item}
                    members={members}
                    assignments={assignments.filter(
                      (assignment) => assignment.item === item.id,
                    )}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
