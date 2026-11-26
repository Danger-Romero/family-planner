import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import FlagOutlined from "@mui/icons-material/FlagOutlined";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useId, useRef, useState } from "react";
import { URGENT_WITHIN_HOURS, dateInput, readItemForm, rolesOf, timeInput } from "../../services/today.js";
import { scheme, stateLayer, withOpacity } from "../../theme/m3";
import MemberAvatar from "../MemberAvatar.jsx";
import People from "./People.jsx";

/** The bar at the top of each view: a button at the start, the view's title, a button at the end. */
function TopBar({ titleId, titleRef, title, start, end }) {
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", gap: 1, px: 1.5, minHeight: 64, borderBottom: 1, borderColor: "divider" }}
    >
      <Box sx={{ flex: "1 1 0", display: "flex" }}>{start}</Box>
      {/* Focusable, so moving to this view can move the focus here. */}
      <Typography
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        variant="titleLarge"
        component="h2"
        sx={{ textAlign: "center", outline: "none" }}
      >
        {title}
      </Typography>
      <Box sx={{ flex: "1 1 0", display: "flex", justifyContent: "flex-end" }}>{end}</Box>
    </Stack>
  );
}

/** A section's heading inside the dialog, like "When" or "Family". */
const Heading = ({ id, children }) => (
  <Typography id={id} variant="titleSmall" component="h3">
    {children}
  </Typography>
);

/** A small line of explanation under a field or a setting. */
const Hint = ({ children, sx }) => (
  <Typography variant="bodySmall" sx={{ color: "text.secondary", ...sx }}>
    {children}
  </Typography>
);

/** A setting with its label at the start and a switch at the end, like "All day". */
function SwitchRow({ label, checked, onChange, disabled }) {
  return (
    <FormControlLabel
      label={label}
      labelPlacement="start"
      control={<Switch checked={checked} onChange={(event) => onChange(event.target.checked)} />}
      disabled={disabled}
      sx={{ display: "flex", mx: 0, gap: 2, justifyContent: "space-between" }}
    />
  );
}

/** The members with `role`, in family order. */
const withRole = (members, roles, role) => members.filter((member) => roles[member.id] === role);

const avatarVariant = { responsible: undefined, attending: "outlined", none: "dashed" };

/** One role's box at the top of "Who is involved?": who has it, or `empty`. */
function RoleSummary({ title, description, members, role, empty, emptyColor }) {
  return (
    <Card variant="outlined" sx={{ flex: "1 1 0", minWidth: 0, p: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="titleSmall" component="p">
        {title}
      </Typography>
      <Hint>{description}</Hint>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, minHeight: 28, alignItems: "center", mt: 0.5 }}>
        {members.length > 0 ? (
          members.map((member) => <MemberAvatar key={member.id} member={member} variant={avatarVariant[role]} />)
        ) : (
          <Typography variant="labelLarge" sx={{ color: emptyColor }}>
            {empty}
          </Typography>
        )}
      </Stack>
    </Card>
  );
}

/**
 * "Who is involved?": each family member is not involved, responsible or attending (one role
 * each). `roles` is as from rolesOf; `you` is the id of who is signed in.
 */
function PeoplePicker({ members, roles, onChange, you }) {
  const familyId = useId();
  const roleOf = (member) => roles[member.id] ?? "none";
  const setRole = (member, role) => {
    const next = { ...roles };
    if (role === "none") delete next[member.id];
    else next[member.id] = role;
    onChange(next);
  };
  const responsible = withRole(members, roles, "responsible");

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row" sx={{ gap: 1 }}>
        <RoleSummary
          title="Responsible"
          description="Makes sure it happens"
          role="responsible"
          members={responsible}
          empty="No one yet"
          emptyColor="error.main"
        />
        <RoleSummary
          title="Attending"
          description="Takes part or needs to be there"
          role="attending"
          members={withRole(members, roles, "attending")}
          empty="No one"
          emptyColor="text.secondary"
        />
      </Stack>

      {responsible.length === 0 && (
        <Stack
          direction="row"
          sx={{
            gap: 1, alignItems: "center", p: 1.5, borderRadius: 3,
            bgcolor: scheme("error-container"), color: scheme("on-error-container"),
          }}
        >
          <WarningAmberRounded aria-hidden="true" />
          <Typography variant="bodyMedium">
            Pick at least one person who is responsible, so someone makes sure it happens.
          </Typography>
        </Stack>
      )}

      <Box component="section" aria-labelledby={familyId}>
        <Heading id={familyId}>Family</Heading>
        {/* role="list": Safari drops the list semantics of a list without bullets. */}
        <Stack component="ul" role="list" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {members.map((member) => (
            <Stack
              component="li"
              key={member.id}
              sx={{ gap: 1.25, py: 1.5, borderBottom: 1, borderColor: "divider" }}
            >
              <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
                {/* Hidden from screen readers: the name is next to it, and the role below. */}
                <MemberAvatar
                  member={member}
                  variant={avatarVariant[roleOf(member)]}
                  aria-hidden="true"
                  sx={{ width: 40, height: 40, typography: "titleMedium", "& .MuiSvgIcon-root": { fontSize: 24 } }}
                />
                <Stack sx={{ minWidth: 0 }}>
                  <Typography variant="titleMedium" component="span">
                    {member.name}
                  </Typography>
                  <Typography variant="bodyMedium" component="span" sx={{ color: "text.secondary" }}>
                    {member.memberType === "child" ? "Child" : "Adult"}
                    {member.id === you && " · you"}
                  </Typography>
                </Stack>
              </Stack>
              <ToggleButtonGroup
                exclusive
                fullWidth
                aria-label={`${member.name}'s role`}
                value={roleOf(member)}
                // Tapping the role that's on keeps it (MUI would turn it off).
                onChange={(_, role) => role && setRole(member, role)}
                // 12px instead of 16px at the sides, so the three labels fit on a 320px-wide phone.
                sx={{ "& .MuiToggleButton-root": { px: 1.5 } }}
              >
                <ToggleButton value="none">Not involved</ToggleButton>
                <ToggleButton value="responsible">Responsible</ToggleButton>
                <ToggleButton value="attending">Attending</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

/**
 * Adding a task or an event, and changing a task: the wireframe's "New task / event" screen, with
 * "Who is involved?" as a second view. Full screen on a phone, a dialog on larger screens.
 *
 * - The main view: Task or Event (only when adding), the title, when (a task's date and deadline,
 *   or an event's date, start and end, or all day), "Mark as important" (tasks), and a People row
 *   that opens the second view.
 * - "Who is involved?": each member is not involved, responsible or attending. Done keeps the
 *   changes, Back (and Escape) drops them.
 *
 * `item` is the task to change (null to add one), `assignments` its { member, role } pairs, and
 * `memberId` who is signed in. The fields start from `item` when the dialog is mounted, so give it
 * a new `key` each time it opens.
 *
 * Saving calls `onSave(values)` with the values from readItemForm (services/today.js): a task's
 * { kind, title, dueAt, manuallyUrgent, assignments } or an event's { kind, title, startsAt,
 * endsAt, allDay, assignments }. The dialog waits for it, and if it throws, shows the error and
 * stays open. Closing it is up to the parent (`onClose`, and after a save).
 */
export default function ItemDialog({ open, item = null, members = [], assignments = [], memberId, onSave, onClose }) {
  const titleId = useId();
  const whenId = useId();
  const importantId = useId();
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"), { noSsr: true });

  const [kind, setKind] = useState(item?.kind ?? "task");
  const [title, setTitle] = useState(item?.title ?? "");
  const [date, setDate] = useState(dateInput(item?.dueAt ?? item?.startsAt));
  const [time, setTime] = useState(item?.kind === "task" ? timeInput(item.dueAt) : "");
  const [starts, setStarts] = useState(item?.kind === "event" && !item.allDay ? timeInput(item.startsAt) : "");
  const [ends, setEnds] = useState(item?.kind === "event" ? timeInput(item.endsAt) : "");
  const [allDay, setAllDay] = useState(item?.allDay ?? false);
  const [important, setImportant] = useState(item?.manuallyUrgent ?? false);
  const [roles, setRoles] = useState(() => rolesOf(assignments));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // "Who is involved?" edits a copy of `roles`, kept with Done.
  const [picking, setPicking] = useState(null);
  const peopleTitleRef = useRef(null);
  const peopleRowRef = useRef(null);
  const moved = useRef(false);
  useEffect(() => {
    // Move the focus with the view (not when the dialog opens).
    if (!moved.current) return;
    (picking ? peopleTitleRef : peopleRowRef).current?.focus();
  }, [picking]);
  const showPicker = (next) => {
    moved.current = true;
    setPicking(next);
  };

  // A half-typed date or time reads as "", so ask the fields themselves.
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const startsRef = useRef(null);
  const endsRef = useRef(null);

  const heading = `${item ? "Edit" : "New"} ${kind}`;
  const isTask = kind === "task";

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    if ([dateRef, timeRef, startsRef, endsRef].some((ref) => ref.current?.validity.badInput)) {
      setError("Enter a valid date and time.");
      return;
    }
    const form = readItemForm({ kind, title, date, time, starts, ends, allDay, important, roles });
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
      setError(failure.message || `Couldn't save the ${kind}. Try again.`);
      setSaving(false);
    }
  }

  const dateField = (props) => (
    <TextField
      type="date"
      value={date}
      onChange={(event) => setDate(event.target.value)}
      disabled={saving}
      inputRef={dateRef}
      slotProps={{ inputLabel: { shrink: true } }}
      {...props}
    />
  );
  const timeField = (label, value, setValue, ref, props) => (
    <TextField
      label={label}
      type="time"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      disabled={saving}
      inputRef={ref}
      slotProps={{ inputLabel: { shrink: true } }}
      sx={{ flex: "1 1 0", minWidth: 0 }}
      {...props}
    />
  );

  const form = (
    <>
      <TopBar
        titleId={titleId}
        title={heading}
        start={<Button variant="text" onClick={onClose} disabled={saving}>Cancel</Button>}
        end={<Button type="submit" variant="contained" disabled={saving || !title.trim()}>Save</Button>}
      />
      <DialogContent sx={{ px: 2.5, pt: 2, pb: 4 }}>
        <Stack sx={{ gap: 2.5 }}>
          {error && (
            <Typography role="alert" variant="bodyMedium" sx={{ color: "error.main" }}>
              {error}
            </Typography>
          )}

          {/* A task can't become an event, so only when adding. */}
          {!item && (
            <ToggleButtonGroup
              exclusive
              fullWidth
              aria-label="Task or event"
              value={kind}
              onChange={(_, value) => value && setKind(value)}
              disabled={saving}
            >
              <ToggleButton value="task">Task</ToggleButton>
              <ToggleButton value="event">Event</ToggleButton>
            </ToggleButtonGroup>
          )}

          <TextField
            label="Title"
            placeholder="What needs to happen?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={saving}
            required
            fullWidth
            // Adding starts with typing the title. Editing, the keyboard would cover the form.
            autoFocus={!item}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Stack component="section" aria-labelledby={whenId} sx={{ gap: 1.5 }}>
            <Heading id={whenId}>When</Heading>
            {isTask ? (
              <>
                {/* Side by side when each gets 160px, so the whole date shows; otherwise one under the other. */}
                <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
                  {dateField({ label: "Date", sx: { flex: "1 1 160px", minWidth: 0 } })}
                  {timeField("Deadline", time, setTime, timeRef, {
                    disabled: saving || !date,
                    sx: { flex: "1 1 160px", minWidth: 0 },
                  })}
                </Stack>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1, minHeight: 40 }}>
                  <Hint>
                    {date
                      ? "Without a time, it's due at the end of the day."
                      : "A task has a deadline. Without a date, it goes under Anytime."}
                  </Hint>
                  {date && (
                    <Button
                      variant="text"
                      onClick={() => {
                        setDate("");
                        setTime("");
                      }}
                      disabled={saving}
                      sx={{ flex: "none" }}
                    >
                      Remove date
                    </Button>
                  )}
                </Stack>
              </>
            ) : (
              <>
                {dateField({ label: "Date", required: true, fullWidth: true })}
                {!allDay && (
                  <Stack direction="row" sx={{ gap: 1 }}>
                    {timeField("Starts", starts, setStarts, startsRef, { required: true })}
                    {timeField("Ends", ends, setEnds, endsRef)}
                  </Stack>
                )}
                <SwitchRow label="All day" checked={allDay} onChange={setAllDay} disabled={saving} />
              </>
            )}
          </Stack>

          {isTask && (
            <Card component="section" aria-labelledby={importantId} variant="outlined" sx={{ px: 2, py: 1 }}>
              <SwitchRow
                label={
                  <Stack id={importantId} component="span" direction="row" sx={{ gap: 1, alignItems: "center" }}>
                    <FlagOutlined aria-hidden="true" fontSize="small" />
                    Mark as important
                  </Stack>
                }
                checked={important}
                onChange={setImportant}
                disabled={saving}
              />
              <Hint sx={{ pb: 1 }}>
                Important tasks are always under Urgent on Today. Others move there by themselves when
                their deadline is less than {URGENT_WITHIN_HOURS} hours away.
              </Hint>
            </Card>
          )}

          <ButtonBase
            ref={peopleRowRef}
            onClick={() => showPicker({ ...roles })}
            disabled={saving}
            sx={{
              gap: 1.5, minHeight: 64, py: 1, px: 1, mx: -1, justifyContent: "flex-start", textAlign: "left",
              borderTop: 1, borderBottom: 1, borderColor: "divider",
              "@media (hover: hover)": {
                "&:hover": { bgcolor: withOpacity(scheme("on-surface"), stateLayer.hover) },
              },
              "&.Mui-focusVisible": { outline: `3px solid ${scheme("secondary")}`, outlineOffset: -3 },
            }}
          >
            <PeopleOutlined aria-hidden="true" />
            <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5 }}>
              <Typography variant="titleSmall" component="span">
                People
              </Typography>
              <People
                responsible={withRole(members, roles, "responsible")}
                attending={withRole(members, roles, "attending")}
              />
            </Stack>
            <ChevronRight aria-hidden="true" sx={{ color: "text.secondary" }} />
          </ButtonBase>
        </Stack>
      </DialogContent>
    </>
  );

  const peopleView = picking && (
    <>
      <TopBar
        titleId={titleId}
        titleRef={peopleTitleRef}
        title="Who is involved?"
        start={
          <Button variant="text" startIcon={<ChevronLeft />} onClick={() => showPicker(null)}>
            Back
          </Button>
        }
        end={
          <Button
            variant="contained"
            onClick={() => {
              setRoles(picking);
              showPicker(null);
            }}
          >
            Done
          </Button>
        }
      />
      <DialogContent sx={{ px: 2.5, pt: 2, pb: 4 }}>
        <PeoplePicker members={members} roles={picking} onChange={setPicking} you={memberId} />
      </DialogContent>
    </>
  );

  return (
    <Dialog
      open={open}
      // Escape on "Who is involved?" goes back to the item.
      onClose={saving ? undefined : picking ? () => showPicker(null) : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      slotProps={{ paper: { component: "form", onSubmit: handleSubmit, noValidate: true } }}
    >
      {picking ? peopleView : form}
    </Dialog>
  );
}
