import Box from "@mui/material/Box";
import { useId } from "react";
import { avatarIcons } from "../services/avatars.js";
import { minTouchTarget, scheme } from "../theme/m3.js";
import MemberAvatar from "./MemberAvatar.jsx";

const choices = [{ name: "", label: "Initial" }, ...avatarIcons];

/**
 * Chooses a member's avatar: their initial (`value` "") or one of the icons in avatars.js.
 * `name` is the name typed so far, for the initial's preview. Radio buttons underneath, so arrow
 * keys move between the choices; each is a 44×44px circle, and the chosen one has a ring.
 */
export default function AvatarPicker({ name, value, onChange, disabled = false }) {
  const group = useId();
  return (
    <Box component="fieldset" disabled={disabled} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <legend>Avatar</legend>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {choices.map((choice) => (
          <Box
            component="label"
            key={choice.label}
            sx={{
              position: "relative",
              display: "grid",
              placeItems: "center",
              width: minTouchTarget,
              height: minTouchTarget,
              boxSizing: "border-box",
              borderRadius: "50%",
              border: "2px solid transparent",
              cursor: "pointer",
              "&:has(input:checked)": { borderColor: scheme("primary") },
              "&:has(input:focus-visible)": {
                outline: `3px solid ${scheme("secondary")}`,
                outlineOffset: 2,
              },
              "&:has(input:disabled)": { opacity: 0.38, cursor: "default" },
              // High Contrast would draw every transparent ring: hide them in the page colour, so
              // only the chosen one has a ring.
              "@media (forced-colors: active)": {
                borderColor: "Canvas",
                "&:has(input:checked)": { borderColor: "Highlight" },
              },
            }}
          >
            {/* The real radio button, invisible over the whole circle. */}
            <Box
              component="input"
              type="radio"
              name={group}
              value={choice.name}
              aria-label={choice.label}
              checked={value === choice.name}
              onChange={() => onChange(choice.name)}
              disabled={disabled}
              sx={{ position: "absolute", inset: 0, m: 0, opacity: 0, cursor: "inherit" }}
            />
            <MemberAvatar member={{ name, avatarIcon: choice.name }} aria-hidden="true" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
