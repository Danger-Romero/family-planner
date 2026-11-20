import Parse from "./parse.js";
import { loadMembers } from "./memberService.js";
import { createFamilyACL } from "./familyAccess.js";

const Assignment = Parse.Object.extend("Assignment");
const Item = Parse.Object.extend("Item");
const Member = Parse.Object.extend("Member");

function toAssignment(row) {
  return {
    id: row.id,
    item: row.get("item")?.id ?? null,
    member: row.get("member")?.id ?? null,
    role: row.get("role"),
  };
}

export async function loadAssignments(items) {
  if (items.length === 0) return [];

  const pointers = items.map((item) =>
    Item.createWithoutData(item.id),
  );

  const rows = await new Parse.Query(Assignment)
    .containedIn("item", pointers)
    .findAll();

  return rows.map(toAssignment);
}

export async function saveAssignments(family, itemId, selection) {
  const user = Parse.User.current();
  if (!user) throw new Error("Log in before assigning members.");
  if (typeof family?.id !== "string" || !family.id || typeof itemId !== "string" || !itemId) {
    throw new Error("Choose an item from your family.");
  }
  if (!Array.isArray(selection)) {
    throw new Error("Choose the members and their assignment roles.");
  }

  const item = await new Parse.Query(Item).get(itemId);
  if (item.get("family")?.id !== family.id) {
    throw new Error("Choose an item from your family.");
  }

  const members = await loadMembers(family);
  if (!members.some((member) => member.user === user.id)) {
    throw new Error("Your account is not a member of this family.");
  }

  const selected = [];
  for (const each of selection) {
    if (!["responsible", "attending"].includes(each?.role)) {
      throw new Error("Choose responsible or attending.");
    }
    if (!members.some((member) => member.id === each.member)) {
      throw new Error("Choose members from your family.");
    }
    if (!selected.some((pair) => pair.member === each.member && pair.role === each.role)) {
      selected.push({ member: each.member, role: each.role });
    }
  }

  const acl = createFamilyACL(members, true);

  // A retry reads the saved pairs again, including any partial batch saves.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const current = await loadAssignments([item]);
    const missing = selected.filter((pair) =>
      !current.some((row) => row.member === pair.member && row.role === pair.role),
    );
    const additions = missing.map((pair) => {
      const assignment = new Assignment();
      assignment.set({
        item: Item.createWithoutData(itemId),
        member: Member.createWithoutData(pair.member),
        role: pair.role,
      });
      assignment.setACL(acl);
      return assignment;
    });

    try {
      if (additions.length > 0) await Parse.Object.saveAll(additions);
    } catch (error) {
      // Another account may have saved a missing pair after our query.
      if (attempt === 0 && error.code === Parse.Error.DUPLICATE_VALUE) continue;
      throw error;
    }

    const removed = current.filter((row) =>
      !selected.some((pair) => pair.member === row.member && pair.role === row.role),
    );
    if (removed.length > 0) {
      await Parse.Object.destroyAll(removed.map((row) => Assignment.createWithoutData(row.id)));
    }

    return loadAssignments([item]);
  }
}
