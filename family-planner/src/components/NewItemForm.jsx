import { useState } from "react";
import Button from "@mui/material/Button";
import AssignmentFields from "./AssignmentFields.jsx";

export default function NewItemForm({ members = [], onAdd, disabled }) {
  const [kind, setKind] = useState("task");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (disabled || !title.trim()) return;

    const dueDate = kind === "task" && dueAt ? new Date(dueAt) : null;
    const start = kind === "event" && startsAt ? new Date(startsAt) : null;
    const end = kind === "event" && endsAt ? new Date(endsAt) : null;

    if (dueDate && Number.isNaN(dueDate.getTime())) {
      setError("Enter a valid due date.");
      return;
    }
    if (kind === "event" && (!start || Number.isNaN(start.getTime()))) {
      setError("Enter a valid start date and time.");
      return;
    }
    if (end && (Number.isNaN(end.getTime()) || end <= start)) {
      setError("The end must be after the start.");
      return;
    }

    setError("");
    const saved = await onAdd({
      kind,
      title: title.trim(),
      dueAt: dueDate,
      startsAt: start,
      endsAt: end,
      assignments,
    });

    if (saved) {
      setTitle("");
      setDueAt("");
      setStartsAt("");
      setEndsAt("");
      setAssignments([]);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>New item</h2>
      <p>
        <label htmlFor="item-kind">Kind</label>{" "}
        <select
          id="item-kind"
          value={kind}
          onChange={(event) => {
            setKind(event.target.value);
            setError("");
          }}
          disabled={disabled}
        >
          <option value="task">Task</option>
          <option value="event">Event</option>
        </select>
      </p>
      <p>
        <label htmlFor="item-title">Title</label>{" "}
        <input
          id="item-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled}
          required
        />
      </p>
      {kind === "task" ? (
        <p>
          <label htmlFor="item-due">Due date and time (optional)</label>{" "}
          <input
            id="item-due"
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            disabled={disabled}
          />
        </p>
      ) : (
        <>
          <p>
            <label htmlFor="item-start">Starts</label>{" "}
            <input
              id="item-start"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              disabled={disabled}
              required
            />
          </p>
          <p>
            <label htmlFor="item-end">Ends (optional)</label>{" "}
            <input
              id="item-end"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              disabled={disabled}
            />
          </p>
        </>
      )}
      <AssignmentFields
        members={members}
        value={assignments}
        onChange={setAssignments}
        disabled={disabled}
      />
      {error && <p role="alert">{error}</p>}
      <Button
        type="submit"
        variant="contained"
        size="small"
        disabled={disabled || !title.trim() || (kind === "event" && !startsAt)}
      >
        Add item
      </Button>
    </form>
  );
}
