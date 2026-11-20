import { useState } from "react";
import Button from "@mui/material/Button";
import AssignmentFields from "./AssignmentFields.jsx";

export default function AssignmentForm({ members = [], assignments = [], onSave, onCancel, disabled = false }) {
  const [selection, setSelection] = useState(() =>
    assignments.map(({ member, role }) => ({ member, role })),
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (disabled) return;
    await onSave(selection);
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Edit assignments">
      <h3>Edit assignments</h3>
      <AssignmentFields
        members={members}
        value={selection}
        onChange={setSelection}
        disabled={disabled}
      />
      <Button type="submit" variant="contained" size="small" disabled={disabled}>
        Save assignments
      </Button>{" "}
      <Button type="button" variant="text" size="small" onClick={onCancel} disabled={disabled}>
        Cancel
      </Button>
    </form>
  );
}
