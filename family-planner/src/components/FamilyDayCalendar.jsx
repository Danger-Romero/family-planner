import Box from "@mui/material/Box";

/** Shared day calendar scaffold; each calendar contains a member and their events. */
export default function FamilyDayCalendar({ calendars, selectedDate }) {
  const columns =
    `48px repeat(${Math.max(calendars.length, 1)}, minmax(0, 1fr))`;

  return (
    <Box
      component="section"
      aria-label={`Family calendar for ${selectedDate.toLocaleDateString(undefined, {
        dateStyle: "full",
      })}`}
      sx={{ height: 500, overflowY: "auto", minWidth: 0 }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: columns,
          minWidth: 0,
        }}
      >
        {/* Header cells */}
        {/* All-day cells */}
        {/* Timeline cells */}
      </Box>
    </Box>
  );
}
