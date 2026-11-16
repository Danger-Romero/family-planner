import Parse from "./parse.js";
import { loadMembers } from "./memberService.js";
import { createFamilyACL } from "./familyAccess.js";

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

  const { kind, dueAt = null, startsAt = null, endsAt = null } = values;
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
    allDay: false,
    manuallyUrgent: false,
    visibility: "everyone",
  });
  for (const field of ["dueAt", "startsAt", "endsAt"]) {
    if (values[field] != null) item.set(field, values[field]);
  }
  item.setACL(createFamilyACL(members, true));
  return toItem(await item.save());
}

export async function setItemCompleted(id, completed) {
  const item = Item.createWithoutData(id);
  item.set("completed", completed);
  await item.save();
}

export async function deleteItem(id) {
  await Item.createWithoutData(id).destroy();
}
