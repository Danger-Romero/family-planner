import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId } from "react";
import { Link } from "react-router-dom";
import { fullDate, peopleOf } from "../../services/today.js";
import { barHeight } from "../NavigationBar.jsx";
import EventCard from "./EventCard.jsx";
import TaskCard from "./TaskCard.jsx";

/** A titled list of cards. Without items it shows `empty`, or nothing at all. */
function Section({ title, items, renderItem, empty }) {
  const id = useId();
  if (items.length === 0 && !empty) return null;
  return (
    <Box component="section" aria-labelledby={id} sx={{ mb: 3 }}>
      <Typography id={id} variant="titleLarge" component="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="bodyMedium" sx={{ color: "text.secondary" }}>
          {empty}
        </Typography>
      ) : (
        // role="list": Safari drops the list semantics of a list without bullets.
        <Stack component="ul" role="list" sx={{ listStyle: "none", m: 0, p: 0, gap: 1 }}>
          {items.map(renderItem)}
        </Stack>
      )}
    </Box>
  );
}

/**
 * The Today page as it looks: the header, the Urgent, Schedule and Anytime sections and the "+".
 * It only draws what it's given; TodayPage loads the data and planToday (services/today.js)
 * decides what goes where. `savingIds` are tasks whose tick is being saved; `onToggle(task, done)`
 * is called when a task is ticked or unticked.
 */
export default function TodayView({
  familyName, now, urgent, schedule, anytime = [], members, assignments, savingIds = [], error = "", onToggle,
}) {
  const card = (urgentSection) => (item) => {
    const people = peopleOf(item.id, assignments, members);
    return item.kind === "task" ? (
      <TaskCard
        key={item.id}
        task={item}
        people={people}
        now={now}
        urgent={urgentSection}
        saving={savingIds.includes(item.id)}
        onToggle={onToggle}
      />
    ) : (
      <EventCard key={item.id} event={item} people={people} now={now} />
    );
  };

  return (
    // The bottom padding keeps the last card clear of the "+".
    <Box sx={{ maxWidth: 600, mx: "auto", px: 2, pt: 2, pb: 11 }}>
      <Box component="header" sx={{ mb: 2 }}>
        <Typography variant="bodyMedium" sx={{ color: "text.secondary" }}>
          {familyName}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="headlineMedium" component="h1">
            Today
          </Typography>
          <Typography variant="bodyMedium" sx={{ color: "text.secondary" }}>
            {fullDate(now)}
          </Typography>
        </Stack>
      </Box>

      {error && (
        <Typography role="alert" variant="bodyMedium" sx={{ color: "error.main", mb: 2 }}>
          {error}
        </Typography>
      )}

      <Section title="Urgent" items={urgent} renderItem={card(true)} />
      <Section title="Schedule" items={schedule} renderItem={card(false)} empty="Nothing planned for today." />
      <Section title="Anytime" items={anytime} renderItem={card(false)} />

      <Fab
        component={Link}
        to="/items"
        aria-label="New task or event"
        sx={{ position: "fixed", right: 16, bottom: `calc(${barHeight}px + env(safe-area-inset-bottom) + 16px)` }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
