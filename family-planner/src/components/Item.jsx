import { useState } from "react";
import Button from '@mui/material/Button';
import AssignmentForm from "./AssignmentForm.jsx";

export default function Item({ item, members = [], assignments = [], onToggle, onRemove, onSaveAssignments, disabled }) {
  const [editing, setEditing] = useState(false);

  function memberNames(role) {
    return assignments
      .filter((assignment) => assignment.role === role)
      .map((assignment) =>
        members.find((member) => member.id === assignment.member)?.name ?? "Unavailable member",
      )
      .join(", ") || "None assigned";
  }

  async function handleSave(selection) {
    const saved = await onSaveAssignments(item.id, selection);
    if (saved) setEditing(false);
    return saved;
  }

  return (
    <li>
      {item.kind === "task" && onToggle ? (
        <label>
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => onToggle(item.id)}
            disabled={disabled}
          />{" "}
          {item.title}
        </label>
      ) : (
        item.title
      )}{" "}
      ({item.kind}){" "}
      {item.kind === "task" && item.dueAt && (
        <>
          — due <time dateTime={item.dueAt.toISOString()}>{item.dueAt.toLocaleString()}</time>{" "}
        </>
      )}
      {item.kind === "event" && item.startsAt && (
        <>
          — <time dateTime={item.startsAt.toISOString()}>{item.startsAt.toLocaleString()}</time>{" "}
          {item.endsAt && (
            <>to <time dateTime={item.endsAt.toISOString()}>{item.endsAt.toLocaleString()}</time>{" "}</>
          )}
        </>
      )}
      <p><strong>Responsible:</strong> {memberNames("responsible")}</p>
      <p><strong>Attending:</strong> {memberNames("attending")}</p>
      {onSaveAssignments && (
        editing ? (
          <AssignmentForm
            members={members}
            assignments={assignments}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            disabled={disabled}
          />
        ) : (
          <Button
            type="button"
            variant="tonal"
            size="xsmall"
            onClick={() => setEditing(true)}
            disabled={disabled}
            aria-label={`Edit assignments for ${item.title}`}
          >
            Edit assignments
          </Button>
        )
      )}{" "}
      {onRemove && (
        <Button
          type="button"
          variant="tonal"
          size="xsmall"
          onClick={() => onRemove(item.id)}
          disabled={disabled}
          aria-label={`Delete ${item.kind}: ${item.title}`}
        >
          Delete
        </Button>
      )}
    </li>
  );
}
