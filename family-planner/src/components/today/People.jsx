import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MemberAvatar from "../MemberAvatar.jsx";

const RoleLabel = ({ children }) => (
  <Typography variant="labelMedium" sx={{ color: "text.secondary" }}>
    {children}
  </Typography>
);

/**
 * Who an item belongs to: "Responsible" with filled avatars, then "Attending" with outlined ones.
 * Without anyone responsible it says so, in the error colour, so nobody forgets it.
 * `responsible` and `attending` are lists of members (see peopleOf in services/today.js).
 */
export default function People({ responsible, attending }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
      {responsible.length > 0 ? (
        <>
          <RoleLabel>Responsible</RoleLabel>
          {responsible.map((member) => <MemberAvatar key={member.id} member={member} />)}
        </>
      ) : (
        <Typography variant="labelMedium" sx={{ color: "error.main" }}>
          No one responsible
        </Typography>
      )}
      {attending.length > 0 && (
        <>
          <Box aria-hidden="true" sx={{ width: "1px", height: 20, mx: 0.5, bgcolor: "divider" }} />
          <RoleLabel>Attending</RoleLabel>
          {attending.map((member) => <MemberAvatar key={member.id} member={member} variant="outlined" />)}
        </>
      )}
    </Stack>
  );
}
