import Avatar from "@mui/material/Avatar";
import { initialOf } from "../services/avatars.js";
import { avatarIconComponents } from "./avatarIconComponents.js";

/**
 * A family member's avatar: their icon, or the first letter of their name. The look comes from the
 * theme (src/theme/components/avatar.js): filled for the person responsible, and
 * `variant="outlined"` for people attending.
 *
 * It's an image named after the person. `label` replaces the name, e.g. "Anna, responsible" when
 * no role label is shown next to it. Other props go to MUI's Avatar.
 */
export default function MemberAvatar({ member, label, ...props }) {
  const Icon = Object.hasOwn(avatarIconComponents, member.avatarIcon ?? "")
    ? avatarIconComponents[member.avatarIcon]
    : null;
  return (
    <Avatar role="img" aria-label={label ?? member.name} {...props}>
      {Icon ? <Icon /> : initialOf(member.name)}
    </Avatar>
  );
}
