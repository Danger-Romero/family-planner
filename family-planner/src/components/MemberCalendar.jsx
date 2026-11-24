import Box from "@mui/material/Box";
import { StandaloneDayView } from "@mui/x-scheduler/day-view";

export default function MemberCalendar({
  member,
  events,
  selectedDate,
}) {
  return (
    <Box
      component="section"
      sx={{ flex: "1 0 280px", minWidth: 280 }}
    >
      <h3>{member.name}</h3>

      <Box sx={{ height: 500, width: "100%" }}>
        <StandaloneDayView
          events={events}
          visibleDate={selectedDate}
          readOnly
        />
      </Box>
    </Box>
  );
}
