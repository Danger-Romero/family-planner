import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

export default function AssignmentFields({ members = [], value = [], onChange, disabled = false }) {
  function toggle(memberId, role) {
    const selected = value.some((assignment) =>
      assignment.member === memberId && assignment.role === role,
    );

    onChange(
      selected
        ? value.filter((assignment) =>
            assignment.member !== memberId || assignment.role !== role,
          )
        : [...value, { member: memberId, role }],
    );
  }

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      {["responsible", "attending"].map((role) => (
        <FormControl
          key={role}
          component="fieldset"
          disabled={disabled}
          sx={{
            width: 200,
            p: 1,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <FormLabel component="legend">
            {role === "responsible" ? "Responsible" : "Attending"}
          </FormLabel>
          <FormGroup>
            {members.map((member) => (
              <FormControlLabel
                key={member.id}
                label={member.name}
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={value.some((assignment) =>
                      assignment.member === member.id && assignment.role === role,
                    )}
                    onChange={() => toggle(member.id, role)}
                  />
                }
              />
            ))}
          </FormGroup>
        </FormControl>
      ))}
    </Stack>
  );
}
