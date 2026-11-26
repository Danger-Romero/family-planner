import Flag from "@mui/icons-material/Flag";
import Schedule from "@mui/icons-material/Schedule";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { deadlineLabel, dueLabel, urgencyLabel } from "../../services/today.js";
import People from "./People.jsx";

/**
 * One task on the Today page: a checkbox to mark it done, its title, when it's due and its people.
 * An urgent task gets the error outline (`color="error"` on the Card) and says why it's urgent.
 * Ticking calls `onToggle(task, done)`; the page saves it. While `saving`, the checkbox waits.
 *
 * The whole card is a button that calls `onEdit(task)`. A button can't hold the checkbox, so the
 * CardActionArea lies under the content and fills the card, and the content lets clicks through
 * to it, except on the checkbox. The action area is a child of the Card, so the card gets the
 * theme's tappable-card states (src/theme/components/card.js).
 */
export default function TaskCard({ task, people, now, urgent = false, saving = false, onToggle, onEdit }) {
  const reason = urgent ? urgencyLabel(task, now) : null;
  const ReasonIcon = reason === "Flagged" ? Flag : Schedule;
  // Urgent: the day or time it's due. Otherwise "by 15:00" today, the day ("Wed 21 Oct") on another
  // day, or nothing for a task without a date.
  const when = urgent ? dueLabel(task, now) : deadlineLabel(task, now);

  return (
    <Card component="li" variant="outlined" color={urgent ? "error" : undefined} sx={{ position: "relative" }}>
      <Stack
        direction="row"
        sx={{
          gap: 0.5, alignItems: "flex-start", p: 1.5, pl: 0.5,
          // Above the action area, but clicks go through to it.
          position: "relative", zIndex: 1, pointerEvents: onEdit ? "none" : undefined,
        }}
      >
        <Checkbox
          checked={task.completed}
          disabled={saving}
          onChange={(event) => onToggle(task, event.target.checked)}
          slotProps={{ input: { "aria-label": `Done: ${task.title}` } }}
          sx={{ pointerEvents: "auto" }}
        />
        <Stack sx={{ flex: 1, minWidth: 0, pt: 1.5, gap: 1 }}>
          <Typography
            variant="titleMedium"
            component="h3"
            sx={task.completed ? { textDecorationLine: "line-through", color: "text.secondary" } : undefined}
          >
            {task.title}
          </Typography>
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            {reason && (
              <Typography
                variant="labelLarge"
                sx={{ color: "error.main", display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                <ReasonIcon sx={{ fontSize: 16 }} />
                {reason}
              </Typography>
            )}
            {when && (
              <Typography variant="bodySmall" sx={{ color: "text.secondary" }}>
                {when}
              </Typography>
            )}
            <Box sx={{ flex: 1 }} />
            <People {...people} />
          </Stack>
        </Stack>
      </Stack>
      {onEdit && (
        // After the content, so the checkbox comes first when tabbing, as it does when reading.
        <CardActionArea
          aria-label={`Edit: ${task.title}`}
          onClick={() => onEdit(task)}
          sx={{ position: "absolute", inset: 0 }}
        />
      )}
    </Card>
  );
}
