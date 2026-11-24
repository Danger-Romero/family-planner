import Parse from "./parse.js";
import { loadMembers } from "./memberService.js";
import { createFamilyACL } from "./familyAccess.js";
import { deleteAssignments } from "./assignmentService.js";

const Item = Parse.Object.extend("Item");
const Family = Parse.Object.extend("Family");
const Member = Parse.Object.extend("Member");

function toItem(item) {
  return {
    id: item.id,
    family: item.get("family")?.id ?? null,
    createdBy: item.get("createdBy")?.id ?? null,
    kind: item.get("kind"),
    title: item.get("title"),
    note: item.get("note") ?? "",
    completed: item.get("completed") ?? false,
    dueAt: item.get("dueAt") ?? null,
    startsAt: item.get("startsAt") ?? null,
    endsAt: item.get("endsAt") ?? null,
    allDay: item.get("allDay") ?? false,
    manuallyUrgent: item.get("manuallyUrgent") ?? false,
    visibility: item.get("visibility") ?? "everyone",
  };
}

export async function loadItems(family) {
  const items = await new Parse.Query(Item)
    .equalTo("family", Family.createWithoutData(family.id))
    .findAll();
  items.sort((first, second) => first.createdAt - second.createdAt);
  return items.map(toItem);
}

function validDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/** Checks a task's due date or an event's start and end. Throws what to fix. */
function checkTimes(kind, { dueAt = null, startsAt = null, endsAt = null }) {
  if (kind === "task") {
    if (dueAt != null && !validDate(dueAt)) throw new Error("Enter a valid task due date.");
    if (startsAt != null || endsAt != null) throw new Error("Tasks use a due date.");
  } else {
    if (!validDate(startsAt)) throw new Error("Enter a valid event start.");
    if (dueAt != null) throw new Error("Events use start and end times.");
    if (endsAt != null && (!validDate(endsAt) || endsAt <= startsAt)) {
      throw new Error("The event end must be after its start.");
    }
  }
}

export async function addItem(family, member, values) {
  if (typeof values.title !== "string" || !values.title.trim()) {
    throw new Error("Enter a title.");
  }
  if (!["task", "event"].includes(values.kind)) {
    throw new Error("Choose task or event.");
  }
  if (!member?.id || !family?.id || member.family !== family.id) {
    throw new Error("Choose a member from your family.");
  }

  const { kind } = values;
  checkTimes(kind, values);

  const user = Parse.User.current();
  if (!user) throw new Error("Log in before adding an item.");
  const members = await loadMembers(family);
  if (!members.some((each) => each.id === member.id && each.user === user.id)) {
    throw new Error("Your account is not a member of this family.");
  }

  const item = new Item();
  item.set({
    family: Family.createWithoutData(family.id),
    createdBy: Member.createWithoutData(member.id),
    kind,
    title: values.title.trim(),
    note: "",
    completed: false,
    allDay: kind === "event" && values.allDay === true,
    manuallyUrgent: values.manuallyUrgent === true,
    visibility: "everyone",
  });
  for (const field of ["dueAt", "startsAt", "endsAt"]) {
    if (values[field] != null) item.set(field, values[field]);
  }
  item.setACL(createFamilyACL(members, true));
  return toItem(await item.save());
}

/**
 * Saves the changes to a task (its title, `dueAt`, `null` for no date, and `manuallyUrgent`) or an
 * event (its title, `startsAt`, `endsAt`, `null` for no end, and `allDay`). `values.kind` is the
 * item's kind: a task can't become an event. Returns the saved item. Who is responsible and
 * attending is saved separately (saveAssignments).
 */
export async function updateItem(id, values) {
  const { kind, title } = values;
  if (typeof title !== "string" || !title.trim()) throw new Error("Enter a title.");
  if (!["task", "event"].includes(kind)) throw new Error("Choose task or event.");
  checkTimes(kind, values);

  const item = await new Parse.Query(Item).get(id);
  if (item.get("kind") !== kind) {
    throw new Error(kind === "event" ? "A task can't become an event." : "An event can't become a task.");
  }
  const setDate = (field, date) => (date ? item.set(field, date) : item.unset(field));
  item.set("title", title.trim());
  if (kind === "task") {
    item.set("manuallyUrgent", values.manuallyUrgent === true);
    setDate("dueAt", values.dueAt);
  } else {
    item.set("allDay", values.allDay === true);
    setDate("startsAt", values.startsAt);
    setDate("endsAt", values.endsAt);
  }
  return toItem(await item.save());
}

export async function setItemCompleted(id, completed) {
  const item = Item.createWithoutData(id);
  item.set("completed", completed);
  await item.save();
}

export async function deleteItem(id) {
  await deleteAssignments(id);
  await Item.createWithoutData(id).destroy();
}
