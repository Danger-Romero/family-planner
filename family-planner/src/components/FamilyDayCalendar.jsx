import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { clockTime } from "../services/today.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const PIXELS_PER_MINUTE = 1;

/** Shared day calendar; each calendar contains a member and their events for the selected day. */
export default function FamilyDayCalendar({ calendars, selectedDate }) {
  const columns = `48px repeat(${Math.max(calendars.length, 1)}, minmax(0, 1fr))`;

  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Local days can contain 23 or 25 hours when daylight saving time changes.
  const timelineHeight = ((dayEnd - dayStart) / MINUTE) * PIXELS_PER_MINUTE;
  const hours = [];
  for (let time = dayStart.getTime(); time < dayEnd.getTime(); time += HOUR) {
    hours.push({
      date: new Date(time),
      top: ((time - dayStart.getTime()) / MINUTE) * PIXELS_PER_MINUTE,
    });
  }

  return (
    <Box
      component="section"
      aria-label={`Family calendar for ${selectedDate.toLocaleDateString(undefined, {
        dateStyle: "full",
      })}`}
      sx={{ height: 500, overflowY: "auto", minWidth: 0 }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: columns,
          minWidth: 0,
        }}
      >
        <Box
          aria-hidden="true"
          sx={{ gridRow: 1, gridColumn: 1, borderBottom: 1, borderColor: "divider" }}
        />
        {calendars.map(({ member }, index) => (
          <Typography
            key={`heading-${member.id}`}
            component="h4"
            variant="titleSmall"
            sx={{
              gridRow: 1,
              gridColumn: index + 2,
              minWidth: 0,
              m: 0,
              p: 1,
              overflowWrap: "anywhere",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {member.name}
          </Typography>
        ))}

        <Typography
          component="span"
          variant="labelSmall"
          sx={{
            gridRow: 2,
            gridColumn: 1,
            p: 0.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          All day
        </Typography>
        {calendars.map(({ member, events }, index) => (
          <Box
            key={`all-day-${member.id}`}
            component="ul"
            role="list"
            aria-label={`All-day events for ${member.name}`}
            sx={{
              gridRow: 2,
              gridColumn: index + 2,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              minWidth: 0,
              m: 0,
              p: 0.5,
              listStyle: "none",
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            {events.filter((event) => event.allDay).map((event) => (
              <Typography
                key={event.id}
                component="li"
                variant="bodySmall"
                sx={{ overflowWrap: "anywhere" }}
              >
                {event.title}
              </Typography>
            ))}
          </Box>
        ))}

        {/* Hour lines span every column and use the same offsets as the labels. */}
        <Box
          aria-hidden="true"
          sx={{
            gridRow: 3,
            gridColumn: "1 / -1",
            position: "relative",
            height: `${timelineHeight}px`,
            pointerEvents: "none",
          }}
        >
          {hours.map(({ date, top }) => (
            <Box
              key={date.getTime()}
              sx={{
                position: "absolute",
                top: `${top}px`,
                insetInline: 0,
                borderTop: 1,
                borderColor: "divider",
              }}
            />
          ))}
        </Box>
        <Box
          aria-hidden="true"
          sx={{ gridRow: 3, gridColumn: 1, position: "relative", height: `${timelineHeight}px` }}
        >
          {hours.map(({ date, top }) => (
            <Typography
              key={date.getTime()}
              component="time"
              dateTime={date.toISOString()}
              variant="labelSmall"
              sx={{
                position: "absolute",
                top: `${top}px`,
                insetInline: 0,
                pt: 0.5,
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              {clockTime(date)}
            </Typography>
          ))}
        </Box>
        {calendars.map(({ member }, index) => (
          <Box
            key={`timeline-${member.id}`}
            sx={{
              gridRow: 3,
              gridColumn: index + 2,
              position: "relative",
              height: `${timelineHeight}px`,
              minWidth: 0,
              borderInlineStart: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Timed events will be positioned here. */}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
