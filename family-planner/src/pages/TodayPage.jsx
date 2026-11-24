import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TodayView from "../components/today/TodayView.jsx";
import { loadAssignments, saveAssignments } from "../services/assignmentService.js";
import { addItem, loadItems, setItemCompleted, updateTask } from "../services/itemService.js";
import { loadMembers } from "../services/memberService.js";
import { planToday } from "../services/today.js";

/** Everything the page needs from the database. */
async function loadToday(family) {
  const [items, members] = await Promise.all([loadItems(family), loadMembers(family)]);
  return { items, members, assignments: await loadAssignments(items) };
}

/**
 * Saves a task from the task dialog: a new one (`task` null) or the changes to `task`, then who
 * is responsible and attending. Returns { task, assignments }: the saved task and its assignments.
 * If the people can't be saved, the error carries the saved `task`, so trying again changes that
 * task instead of adding it twice.
 */
async function saveTaskToDatabase({ family, member, task, values }) {
  const { assignments, ...fields } = values;
  const saved = task ? await updateTask(task.id, fields) : await addItem(family, member, { kind: "task", ...fields });
  try {
    return { task: saved, assignments: await saveAssignments(family, saved.id, assignments) };
  } catch (cause) {
    const error = new Error(`"${saved.title}" was saved, but not who's responsible and attending. Try again.`, { cause });
    error.task = saved;
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
 * and saves a ticked task and a task from the task dialog.
 * TodayView draws it.
 *
 * Which section an item is in is worked out when the page loads, and again after a task is saved
 * from the dialog (it may belong somewhere else now). Not when a task is ticked: a ticked urgent
 * task stays where it is (crossed out) instead of jumping away under your finger.
 *
 * `member` is who is signed in: a new task is created by them. `load`, `saveCompleted` and
 * `saveTask` are the services; the stories pass stand-ins for them.
 */
export default function TodayPage({
  family, member, load = loadToday, saveCompleted = setItemCompleted, saveTask = saveTaskToDatabase,
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

  /** Puts a task saved from the dialog on the page, with its `assignments` if they were saved too. */
  function showSaved(task, assignments) {
    setData((current) => {
      const items = current.items.some((item) => item.id === task.id)
        // The tick shown here wins: a tick may still be on its way to the database.
        ? current.items.map((item) => (item.id === task.id ? { ...task, completed: item.completed } : item))
        : [...current.items, task];
      return {
        ...current,
        items,
        assignments: assignments
          ? [...current.assignments.filter((assignment) => assignment.item !== task.id), ...assignments]
          : current.assignments,
        ...layOut(items, new Date()),
      };
    });
  }

  async function handleSaveTask(task, values) {
    try {
      const saved = await saveTask({ family, member, task, values });
      showSaved(saved.task, saved.assignments);
    } catch (error) {
      if (error.task) showSaved(error.task);
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
      savingIds={savingIds}
      error={saveError}
      onToggle={handleToggle}
      onSaveTask={handleSaveTask}
    />
  );
}
