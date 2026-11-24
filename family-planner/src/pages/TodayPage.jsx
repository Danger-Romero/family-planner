import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TodayView from "../components/today/TodayView.jsx";
import { loadAssignments, saveAssignments } from "../services/assignmentService.js";
import { addItem, loadItems, setItemCompleted, updateItem } from "../services/itemService.js";
import { loadMembers } from "../services/memberService.js";
import { planToday } from "../services/today.js";

/** Everything the page needs from the database. */
async function loadToday(family) {
  const [items, members] = await Promise.all([loadItems(family), loadMembers(family)]);
  return { items, members, assignments: await loadAssignments(items) };
}

/**
 * Saves a task or event from the item dialog: a new one (`item` null) or the changes to `item`,
 * then who is responsible and attending. Returns { item, assignments }: the saved item and its
 * assignments. If the people can't be saved, the error carries the saved `item`, so trying again
 * changes that item instead of adding it twice.
 */
async function saveItemToDatabase({ family, member, item, values }) {
  const { assignments, ...fields } = values;
  const saved = item ? await updateItem(item.id, fields) : await addItem(family, member, fields);
  try {
    return { item: saved, assignments: await saveAssignments(family, saved.id, assignments) };
  } catch (cause) {
    const error = new Error(`"${saved.title}" was saved, but not who's responsible and attending. Try again.`, { cause });
    error.item = saved;
    throw error;
  }
}

/** The ids in each section (see planToday), and the time they were worked out for. */
function layOut(items, now) {
  const plan = planToday(items, now);
  const ids = (section) => section.map((item) => item.id);
  return { now, urgent: ids(plan.urgent), schedule: ids(plan.schedule), anytime: ids(plan.anytime) };
}

/**
 * The Today page. It loads the family's items, members and assignments, lets planToday
 * (services/today.js) decide what's urgent, what's on the schedule and which tasks have no date,
 * and saves a ticked task and a task or event from the item dialog.
 * TodayView draws it.
 *
 * Which section an item is in is worked out when the page loads, and again after an item is saved
 * from the dialog (it may belong somewhere else now). Not when a task is ticked: a ticked urgent
 * task stays where it is (crossed out) instead of jumping away under your finger.
 *
 * `member` is who is signed in: a new item is created by them. `load`, `saveCompleted` and
 * `saveItem` are the services; the stories pass stand-ins for them.
 */
export default function TodayPage({
  family, member, load = loadToday, saveCompleted = setItemCompleted, saveItem = saveItemToDatabase,
}) {
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
        // Ids, so the items themselves can change (ticked) without moving.
        setData({ ...loaded, ...layOut(loaded.items, new Date()) });
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

  /** Puts an item saved from the dialog on the page, with its `assignments` if they were saved too. */
  function showSaved(saved, assignments) {
    setData((current) => {
      const items = current.items.some((item) => item.id === saved.id)
        // The tick shown here wins: a tick may still be on its way to the database.
        ? current.items.map((item) => (item.id === saved.id ? { ...saved, completed: item.completed } : item))
        : [...current.items, saved];
      return {
        ...current,
        items,
        assignments: assignments
          ? [...current.assignments.filter((assignment) => assignment.item !== saved.id), ...assignments]
          : current.assignments,
        ...layOut(items, new Date()),
      };
    });
  }

  async function handleSaveItem(item, values) {
    try {
      const saved = await saveItem({ family, member, item, values });
      showSaved(saved.item, saved.assignments);
    } catch (error) {
      if (error.item) showSaved(error.item);
      throw error;
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
      memberId={member?.id}
      savingIds={savingIds}
      error={saveError}
      onToggle={handleToggle}
      onSaveItem={handleSaveItem}
    />
  );
}
