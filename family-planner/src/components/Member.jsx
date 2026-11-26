import Box from "@mui/material/Box";
import MemberAvatar from "./MemberAvatar.jsx";

export default function Member({ member }) {
  return (
    // The row is inside the <li>, so it stays a list item (bullets, and a list for screen readers).
    <li>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* The name is in the text, so the avatar is hidden from screen readers. */}
        <MemberAvatar member={member} aria-hidden="true" />
        {member.name} ({member.memberType}) — {member.user ? "has a login account" : "no login account"}
      </Box>
    </li>
  );
}
