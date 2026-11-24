// Sample data for the Today stories: the wireframe's day for the Hansen family, on
// Monday 19 October 2026 at 10:00.

const at = (hours, minutes = 0, day = 19) => new Date(2026, 9, day, hours, minutes);

export const sampleNow = at(10);

export const sampleFamily = { id: "hansen", name: "The Hansen family" };

export const sampleMembers = [
  { id: "anna", name: "Anna", memberType: "adult", avatarIcon: null },
  { id: "jonas", name: "Jonas", memberType: "adult", avatarIcon: null },
  { id: "ella", name: "Ella", memberType: "child", avatarIcon: "star" },
  { id: "theo", name: "Theo", memberType: "child", avatarIcon: null },
];

const item = (id, values) => ({
  id, family: "hansen", createdBy: "anna", note: "", completed: false, dueAt: null, startsAt: null,
  endsAt: null, allDay: false, manuallyUrgent: false, visibility: "everyone", ...values,
});

export const sampleItems = [
  item("sign-up", { kind: "task", title: "Sign up Ella for school trip", dueAt: at(12) }),
  item("pay", { kind: "task", title: "Pay football membership", dueAt: at(9, 0, 21), manuallyUrgent: true }),
  item("school-run", { kind: "event", title: "School run", startsAt: at(7, 45), endsAt: at(8, 15) }),
  item("plants", { kind: "task", title: "Water the plants", dueAt: at(9), completed: true }),
  item("kit", { kind: "task", title: "Pack football kit", dueAt: at(15) }),
  item("football", { kind: "event", title: "Football practice", startsAt: at(15, 30), endsAt: at(16, 30) }),
  item("dentist", { kind: "event", title: "Dentist", startsAt: at(16), endsAt: at(16, 45) }),
  item("groceries", { kind: "task", title: "Buy groceries for the week", dueAt: at(19) }),
  // Without a date: these go under "Anytime".
  item("bike", { kind: "task", title: "Fix the bike light" }),
  item("plumber", { kind: "task", title: "Call the plumber" }),
];

const role = (itemId, member, roleName) => ({ id: `${itemId}-${member}-${roleName}`, item: itemId, member, role: roleName });

export const sampleAssignments = [
  role("sign-up", "anna", "responsible"),
  role("pay", "jonas", "responsible"),
  role("school-run", "jonas", "responsible"),
  role("school-run", "ella", "attending"),
  role("school-run", "theo", "attending"),
  role("plants", "theo", "responsible"),
  role("kit", "ella", "responsible"),
  role("football", "anna", "responsible"),
  role("football", "ella", "attending"),
  role("dentist", "jonas", "responsible"),
  role("dentist", "theo", "attending"),
  role("bike", "theo", "responsible"),
  role("plumber", "anna", "responsible"),
];
