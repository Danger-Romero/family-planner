import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

export default function CalendarPage({ family }) {
  const [days] = useState(() =>
    Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      return date;
    }),
  );

  const [selectedDate, setSelectedDate] = useState(() => days[0]);

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

      <p>Items for this date should go here</p>
    </>
  );
}