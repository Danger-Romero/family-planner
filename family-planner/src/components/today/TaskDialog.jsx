import Close from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useId, useRef, useState } from "react";
import { dateTimeInput, readTaskForm } from "../../services/today.js";
import MemberAvatar from "../MemberAvatar.jsx";

/**
 * Who has `role` on the task: a checkbox per member, with their avatar (filled for responsible,
 * outlined for attending, as on the task cards) and name. `value` is the task's { member, role }
 * pairs, for both roles.
 */
function PeoplePicker({ role, label, members, value, onChange, disabled }) {
  const id = useId();
  const has = (member) => value.some((pair) => pair.member === member.id && pair.role === role);
  const toggle = (member) =>
    onChange(has(member)
      ? value.filter((pair) => pair.member !== member.id || pair.role !== role)
      : [...value, { member: member.id, role }]);

  return (
    // As wide as its longest name, then sharing what's left; it shrinks only alone on its line.
    <Stack role="group" aria-labelledby={id} sx={{ flex: "1 1 auto", minWidth: 0 }}>
      <Typography id={id} variant="labelLarge" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      {members.map((member) => (
        <FormControlLabel
          key={member.id}
          control={<Checkbox checked={has(member)} onChange={() => toggle(member)} />}
          label={
            <Stack component="span" direction="row" sx={{ alignItems: "center", gap: 1 }}>
              {/* Hidden from screen readers: the name is next to it. Dimmed with the name. */}
              <MemberAvatar
                member={member}
                variant={role === "attending" ? "outlined" : undefined}
                aria-hidden="true"
                sx={{ flex: "none", opacity: disabled ? 0.38 : undefined }}
              />
              <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                {member.name}
              </Box>
            </Stack>
          }
          disabled={disabled}
          // Lines the box up with the label above, like "Flag as urgent".
          sx={{ ml: "-15px", mr: 0, minWidth: 0 }}
        />
      ))}
    </Stack>
  );
}

/**
 * The dialog for adding a task (`task` null) or changing one: its title, when it's due, whether
 * it's flagged as urgent, and who is responsible and attending (`assignments`, the task's
 * { member, role } pairs).
 *
 * The fields start from `task` when the dialog is mounted, so give it a new `key` each time it
 * opens. Saving calls `onSave({ title, dueAt, manuallyUrgent, assignments })`; the dialog waits for
 * it, and if it throws, shows the error and stays open. Closing it is up to the parent (`onClose`,
 * and after a save).
 */
export default function TaskDialog({ open, task = null, members = [], assignments = [], onSave, onClose }) {
  const titleId = useId();
  const dueRef = useRef(null);
  const [title, setTitle] = useState(task?.title ?? "");
  const [due, setDue] = useState(dateTimeInput(task?.dueAt));
  const [flagged, setFlagged] = useState(task?.manuallyUrgent ?? false);
  const [people, setPeople] = useState(() => assignments.map(({ member, role }) => ({ member, role })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    // A half-typed date reads as "" (no date), so ask the field itself.
    if (dueRef.current?.validity.badInput) {
      setError("Enter a valid due date and time.");
      return;
    }
    const form = readTaskForm({ title, due, flagged, assignments: people });
    if (form.error) {
      setError(form.error);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave(form.values);
      // Stays "saving" while the parent closes the dialog.
    } catch (failure) {
      setError(failure.message || "Couldn't save the task. Try again.");
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      slotProps={{ paper: { component: "form", onSubmit: handleSubmit, noValidate: true } }}
    >
      <DialogTitle id={titleId}>{task ? "Edit task" : "New task"}</DialogTitle>
      <DialogContent>
        {/* The top padding keeps the title field's label clear of the dialog title. */}
        <Stack sx={{ gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={saving}
            required
            fullWidth
            // A new task starts with typing its title. Editing, the keyboard would cover the form.
            autoFocus={!task}
          />
          <TextField
            label="Due"
            type="datetime-local"
            value={due}
            onChange={(event) => setDue(event.target.value)}
            disabled={saving}
            fullWidth
            inputRef={dueRef}
            helperText="Without a date, it's under Anytime."
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: due && (
                  <InputAdornment position="end">
                    <IconButton edge="end" aria-label="Remove the due date" onClick={() => setDue("")} disabled={saving}>
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControlLabel
            label="Flag as urgent"
            control={<Checkbox checked={flagged} onChange={(event) => setFlagged(event.target.checked)} />}
            disabled={saving}
            // Lines the box up with the fields: it sits 15px into the checkbox's 48px touch area.
            sx={{ ml: "-15px" }}
          />
          {/* Side by side when both fit (most phones), so the dialog stays short; else one under the other. */}
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2 }}>
            <PeoplePicker
              role="responsible"
              label="Responsible"
              members={members}
              value={people}
              onChange={setPeople}
              disabled={saving}
            />
            <PeoplePicker
              role="attending"
              label="Attending"
              members={members}
              value={people}
              onChange={setPeople}
              disabled={saving}
            />
          </Stack>
          {error && (
            <Typography role="alert" variant="bodyMedium" sx={{ color: "error.main" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      {/* 24px, like the content above (MUI has 8px). */}
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="text" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={saving || !title.trim()}>
          {task ? "Save" : "Add task"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
