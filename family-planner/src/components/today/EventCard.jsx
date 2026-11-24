import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { eventTimes } from "../../services/today.js";
import People from "./People.jsx";

/** One event on the Today page: its times in a 48px column (as wide as a task's checkbox), its title and its people. */
export default function EventCard({ event, people, now }) {
  const { start, end } = eventTimes(event, now);
  return (
    <Card component="li" variant="outlined">
      <Stack direction="row" sx={{ gap: 0.5, alignItems: "flex-start", p: 1.5, pl: 0.5 }}>
        <Stack sx={{ width: 48, flex: "none", alignItems: "center", textAlign: "center" }}>
          {/* A span: title styles are headings by default, and a time isn't one. */}
          <Typography variant="titleSmall" component="span">
            {start}
          </Typography>
          {end && (
            <Typography variant="bodySmall" sx={{ color: "text.secondary" }}>
              {end}
            </Typography>
          )}
        </Stack>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Typography variant="titleMedium" component="h3">
            {event.title}
          </Typography>
          <People {...people} />
        </Stack>
      </Stack>
    </Card>
  );
}
