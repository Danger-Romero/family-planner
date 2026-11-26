import { useEffect, useId, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { calendarEventEnd, layoutDayEvents } from "../services/calendar.js";
import { clockTime } from "../services/today.js";
import { minTouchTarget } from "../theme/m3.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const PIXELS_PER_MINUTE = 1;

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

function eventWhen(event) {
  const start = new Date(event.start);
  const end = calendarEventEnd(event.start, event.end);
  if (event.allDay) {
    // All-day end dates are exclusive; a midnight end belongs to the previous day.
    const lastDay = new Date(Math.max(start.getTime(), end.getTime() - 1));
    const dates =
      start.toDateString() === lastDay.toDateString()
        ? dateFormat.format(start)
        : `${dateFormat.format(start)} – ${dateFormat.format(lastDay)}`;
    return `All day · ${dates}`;
  }
  return `${dateTimeFormat.format(start)} – ${dateTimeFormat.format(end)}`;
}

/** Small tiles stay visual; the member's heading opens a list with full-size controls. */
function EventTile({ event, member, interactive, fill = false, onOpen }) {
  const content = (
    <>
      <Typography
        component="span"
        variant="bodySmall"
        sx={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: fill ? 3 : 2,
          overflow: "hidden",
          overflowWrap: "anywhere",
        }}
      >
        {event.title}
      </Typography>
      {!event.allDay && (!fill || interactive) && (
        <Typography
          component="span"
          variant="labelSmall"
          sx={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {clockTime(new Date(event.start))}–
          {clockTime(calendarEventEnd(event.start, event.end))}
        </Typography>
      )}
    </>
  );
  const sx = {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    width: "100%",
    height: fill ? "100%" : undefined,
    minHeight: fill ? 0 : minTouchTarget,
    minWidth: 0,
    boxSizing: "border-box",
    p: 0.5,
    borderRadius: 1,
    overflow: "hidden",
    textAlign: "start",
    bgcolor: "secondary.main",
    color: "secondary.contrastText",
  };
  return interactive ? (
    <ButtonBase
      type="button"
      aria-label={`${member.name}: ${event.title}, ${eventWhen(event)}`}
      aria-haspopup="dialog"
      onClick={onOpen}
      sx={{
        ...sx,
        "&.Mui-focusVisible": {
          outline: "3px solid",
          outlineColor: "primary.main",
          outlineOffset: -3,
        },
        "&:hover": { boxShadow: "inset 0 0 0 1px currentColor" },
      }}
    >
      {content}
    </ButtonBase>
  ) : (
    <Box aria-hidden="true" sx={sx}>
      {content}
    </Box>
  );
}

/** Shared day calendar; each calendar contains a member and their events for the selected day. */
export default function FamilyDayCalendar({ calendars, selectedDate }) {
  const scroller = useRef(null);
  const closeButton = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [columnWidth, setColumnWidth] = useState(0);
  const [dialog, setDialog] = useState({
    open: false,
    memberId: null,
    eventId: null,
  });
  const columns = `48px repeat(${Math.max(calendars.length, 1)}, minmax(0, 1fr))`;

  useEffect(() => {
    const node = scroller.current;
    const measure = () =>
      setColumnWidth(
        Math.max(
          0,
          (node.clientWidth - 48) / Math.max(calendars.length, 1) - 1,
        ),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [calendars.length]);

  const activeCalendar = calendars.find(
    ({ member }) => member.id === dialog.memberId,
  );
  const activeEvent = activeCalendar?.events.find(
    (event) => event.id === dialog.eventId,
  );
  const dialogEvents = [...(activeCalendar?.events ?? [])].sort(
    (first, second) =>
      Number(second.allDay) - Number(first.allDay) ||
      new Date(first.start) - new Date(second.start),
  );
  const openEvent = (memberId, eventId) => {
    setDialog({ open: true, memberId, eventId });
    if (dialog.open) closeButton.current?.focus();
  };
  const closeDialog = () =>
    setDialog((current) => ({ ...current, open: false }));

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
    <>
      <Box
        ref={scroller}
        component="section"
        tabIndex={0}
        aria-label={`Family calendar for ${selectedDate.toLocaleDateString(
          undefined,
          {
            dateStyle: "full",
          },
        )}`}
        sx={{
          height: 500,
          overflowY: "auto",
          minWidth: 0,
          boxSizing: "border-box",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          bgcolor: "background.default",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: -2,
          },
        }}
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
            sx={{
              gridRow: 1,
              gridColumn: 1,
              borderBottom: 1,
              borderColor: "divider",
              position: "sticky",
              top: 0,
              zIndex: 2,
              bgcolor: "background.paper",
            }}
          />
          {calendars.map(({ member, events }, index) => (
            <Box
              key={`heading-${member.id}`}
              component="h4"
              sx={{
                gridRow: 1,
                gridColumn: index + 2,
                minWidth: 0,
                m: 0,
                overflowWrap: "anywhere",
                borderBottom: 1,
                borderColor: "divider",
                position: "sticky",
                top: 0,
                zIndex: 2,
                bgcolor: "background.paper",
              }}
            >
              <ButtonBase
                type="button"
                aria-label={`View events for ${member.name} (${events.length})`}
                aria-haspopup="dialog"
                onClick={() =>
                  setDialog({ open: true, memberId: member.id, eventId: null })
                }
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  minWidth: 0,
                  minHeight: minTouchTarget,
                  height: "100%",
                  p: 0.5,
                  textAlign: "center",
                  "&.Mui-focusVisible": {
                    outline: "3px solid",
                    outlineColor: "primary.main",
                    outlineOffset: -3,
                  },
                }}
              >
                <Typography
                  component="span"
                  variant="titleSmall"
                  sx={{
                    maxWidth: "100%",
                    overflowWrap: "anywhere",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {member.name}
                </Typography>
                <Typography
                  component="span"
                  variant="labelSmall"
                  sx={{ color: "text.secondary" }}
                >
                  {events.length} {events.length === 1 ? "event" : "events"}
                </Typography>
              </ButtonBase>
            </Box>
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
              {events
                .filter((event) => event.allDay)
                .map((event) => (
                  <Box
                    key={event.id}
                    component="li"
                    aria-hidden={columnWidth - 8 < minTouchTarget || undefined}
                  >
                    <EventTile
                      event={event}
                      member={member}
                      interactive={columnWidth - 8 >= minTouchTarget}
                      onOpen={() => openEvent(member.id, event.id)}
                    />
                  </Box>
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
            sx={{
              gridRow: 3,
              gridColumn: 1,
              position: "relative",
              height: `${timelineHeight}px`,
            }}
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
          {calendars.map(({ member, events }, index) => (
            <Box
              key={`timeline-${member.id}`}
              component="ul"
              role="list"
              aria-label={`Timed events for ${member.name}`}
              sx={{
                gridRow: 3,
                gridColumn: index + 2,
                position: "relative",
                height: `${timelineHeight}px`,
                minWidth: 0,
                m: 0,
                p: 0,
                listStyle: "none",
                borderInlineStart: "1px solid",
                borderColor: "divider",
              }}
            >
              {layoutDayEvents(events, selectedDate).map(
                ({ event, topMinutes, durationMinutes, lane, laneCount }) => (
                  <Box
                    key={event.id}
                    component="li"
                    aria-hidden={
                      durationMinutes * PIXELS_PER_MINUTE - 2 <
                        minTouchTarget ||
                      columnWidth / laneCount - 2 < minTouchTarget ||
                      undefined
                    }
                    sx={{
                      position: "absolute",
                      top: `${topMinutes * PIXELS_PER_MINUTE}px`,
                      height: `${durationMinutes * PIXELS_PER_MINUTE}px`,
                      insetInlineStart: `${(lane / laneCount) * 100}%`,
                      width: `${100 / laneCount}%`,
                      boxSizing: "border-box",
                      minWidth: 0,
                      p: "1px",
                    }}
                  >
                    <EventTile
                      event={event}
                      member={member}
                      fill
                      interactive={
                        durationMinutes * PIXELS_PER_MINUTE - 2 >=
                          minTouchTarget &&
                        columnWidth / laneCount - 2 >= minTouchTarget
                      }
                      onOpen={() => openEvent(member.id, event.id)}
                    />
                  </Box>
                ),
              )}
            </Box>
          ))}
        </Box>
      </Box>
      <Dialog
        open={dialog.open && Boolean(activeCalendar)}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby={titleId}
        aria-describedby={activeEvent ? descriptionId : undefined}
      >
        <DialogTitle
          id={titleId}
          component="h2"
          variant="titleLarge"
          sx={{ overflowWrap: "anywhere" }}
        >
          {activeEvent?.title ??
            (activeCalendar
              ? `Events for ${activeCalendar.member.name}`
              : "Events")}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {activeEvent ? (
            <>
              <Typography id={descriptionId} variant="bodyMedium">
                {eventWhen(activeEvent)}
              </Typography>
              <Typography variant="bodyMedium" sx={{ mt: 1 }}>
                For {activeCalendar.member.name}
              </Typography>
            </>
          ) : dialogEvents.length === 0 ? (
            <Typography variant="bodyMedium">
              No events for this date.
            </Typography>
          ) : (
            <Box
              component="ul"
              role="list"
              sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}
            >
              {dialogEvents.map((event) => (
                <Box key={event.id} component="li" sx={{ minWidth: 0 }}>
                  <ButtonBase
                    type="button"
                    aria-label={`View event: ${event.title}, ${eventWhen(event)}`}
                    onClick={() =>
                      openEvent(activeCalendar.member.id, event.id)
                    }
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      width: "100%",
                      minHeight: minTouchTarget,
                      minWidth: 0,
                      p: 1,
                      textAlign: "start",
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      "&.Mui-focusVisible": {
                        outline: "3px solid",
                        outlineColor: "primary.main",
                        outlineOffset: -3,
                      },
                    }}
                  >
                    <Typography component="span" variant="bodyMedium">
                      {event.title}
                    </Typography>
                    <Typography
                      component="span"
                      variant="bodySmall"
                      sx={{ color: "text.secondary" }}
                    >
                      {eventWhen(event)}
                    </Typography>
                  </ButtonBase>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {activeEvent && (
            <Button
              key="back"
              onClick={() => {
                setDialog((current) => ({ ...current, eventId: null }));
                closeButton.current?.focus();
              }}
            >
              Back to events
            </Button>
          )}
          <Button key="close" ref={closeButton} autoFocus onClick={closeDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
