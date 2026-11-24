import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TodayView from "../components/today/TodayView.jsx";
import { loadAssignments } from "../services/assignmentService.js";
import { loadItems, setItemCompleted } from "../services/itemService.js";
import { loadMembers } from "../services/memberService.js";
import { planToday } from "../services/today.js";

/** Everything the page needs from the database. */
async function loadToday(family) {
  const [items, members] = await Promise.all([loadItems(family), loadMembers(family)]);
  return { items, members, assignments: await loadAssignments(items) };
}

/**
 * The Today page. It loads the family's items, members and assignments, lets planToday
 * (services/today.js) decide what's urgent, what's on the schedule and which tasks have no date,
 * and saves a ticked task.
 * TodayView draws it.
 *
 * Which section an item is in is worked out once, when the page loads: a ticked urgent task stays
 * where it is (crossed out) instead of jumping away under your finger.
 *
 * `load` and `saveCompleted` are the services; the stories pass stand-ins for them.
 */
export default function TodayPage({ family, load = loadToday, saveCompleted = setItemCompleted }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [savingIds, setSavingIds] = useState([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setLoadError("");
      try {
        const loaded = await load(family);
        if (!active) return;
        const now = new Date();
        const plan = planToday(loaded.items, now);
        setData({
          ...loaded,
          now,
          // Ids, so the items themselves can change (ticked) without moving.
          urgent: plan.urgent.map((item) => item.id),
          schedule: plan.schedule.map((item) => item.id),
          anytime: plan.anytime.map((item) => item.id),
        });
      } catch (error) {
        if (active) setLoadError(error.message || "Could not load today. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [family, load, reload]);

  function setCompleted(id, completed) {
    setData((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, completed } : item)),
    }));
  }

  async function handleToggle(task, completed) {
    setSaveError("");
    setSavingIds((ids) => [...ids, task.id]);
    // Shown at once; taken back if saving fails.
    setCompleted(task.id, completed);
    try {
      await saveCompleted(task.id, completed);
    } catch {
      setCompleted(task.id, !completed);
      setSaveError(`Couldn't save "${task.title}". Try again.`);
    } finally {
      setSavingIds((ids) => ids.filter((id) => id !== task.id));
    }
  }

  if (loading || loadError) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
        {loading ? (
          <Typography role="status" variant="bodyMedium">Loading today…</Typography>
        ) : (
          <>
            <Typography role="alert" variant="bodyMedium" sx={{ mb: 2 }}>{loadError}</Typography>
            <Button variant="contained" onClick={() => setReload((count) => count + 1)}>Try again</Button>
          </>
        )}
      </Box>
    );
  }

  const byId = new Map(data.items.map((item) => [item.id, item]));
  return (
    <TodayView
      familyName={family.name}
      now={data.now}
      urgent={data.urgent.map((id) => byId.get(id))}
      schedule={data.schedule.map((id) => byId.get(id))}
      anytime={data.anytime.map((id) => byId.get(id))}
      members={data.members}
      assignments={data.assignments}
      savingIds={savingIds}
      error={saveError}
      onToggle={handleToggle}
    />
  );
}
