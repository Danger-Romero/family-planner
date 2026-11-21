/**
 * The M3 checkbox's 18px box with both marks. CSS on the Checkbox root (checkbox.jsx) shows the
 * tick, the dash or neither.
 *
 * The theme uses this one component for `icon`, `checkedIcon` and `indeterminateIcon`, so React
 * keeps the same DOM node when the checkbox is toggled, and the marks can animate. (MUI passes a
 * `fontSize` prop; it's ignored.)
 */
export default function CheckboxIcon() {
  return (
    <span className="M3Checkbox-box">
      <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        {/* The Compose checkmark and dash, in the 18px box. */}
        <path className="M3Checkbox-tick" pathLength="1" d="M3.6 9 7.2 12.6 14.4 5.4" />
        <path className="M3Checkbox-dash" pathLength="1" d="M3.6 9H14.4" />
      </svg>
    </span>
  );
}
