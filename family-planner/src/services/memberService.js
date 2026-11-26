import Parse from "./parse.js";
import { createFamilyACL } from "./familyAccess.js";
import { isAvatarIcon } from "./avatars.js";

const Family = Parse.Object.extend("Family");
const Member = Parse.Object.extend("Member");
const Item = Parse.Object.extend("Item");

// Convert database pointers to IDs and keep Parse objects inside services.
export function toMember(member) {
  return {
    id: member.id,
    family: member.get("family")?.id ?? null,
    user: member.get("user")?.id ?? null,
    name: member.get("name"),
    memberType: member.get("memberType"),
    birthDate: member.get("birthDate") ?? null,
    defaultSavedView: member.get("defaultSavedView")?.id ?? null,
    // One of the names in avatars.js, or null for the initial.
    avatarIcon: member.get("avatarIcon") ?? null,
  };
}

export async function loadCurrentMember() {
  const user = Parse.User.current();
  if (!user) return null;

  const member = await new Parse.Query("Member")
    .equalTo("user", user)
    .first();
  return member ? toMember(member) : null;
}

export async function loadMembers(family) {
  const members = await new Parse.Query("Member")
    .equalTo("family", Family.createWithoutData(family.id))
    .findAll();
  return members.map(toMember).sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export async function addMember({ name, memberType, username = "", birthDate = "", avatarIcon = "" }) {
  if (!name.trim()) throw new Error("Enter a member name.");
  if (!["adult", "child"].includes(memberType)) throw new Error("Choose adult or child.");
  if (avatarIcon && !isAvatarIcon(avatarIcon)) throw new Error("Choose one of the avatar icons.");

  let birthday = null;
  if (birthDate) {
    birthday = new Date(birthDate + "T00:00:00.000Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(birthday.getTime()) || birthday.toISOString().slice(0, 10) !== birthDate) {
      throw new Error("Enter a valid birth date.");
    }
  }

  if (!Parse.User.current()) throw new Error("Log in before adding a member.");
  const currentMember = await loadCurrentMember();
  if (!currentMember || currentMember.memberType !== "adult") {
    throw new Error("Only adult family members can add members.");
  }
  const family = Family.createWithoutData(currentMember.family);
  let account = null;
  if (username.trim()) {
    account = await new Parse.Query(Parse.User)
      .equalTo("username", username.trim())
      .first();
    if (!account) throw new Error("No user with that username. Ask them to sign up first.");
  }

  const members = await new Parse.Query(Member).equalTo("family", family).findAll();
  // Re-adding an existing account repairs sharing without changing its name/type.
  let member = account ? members.find((each) => each.get("user")?.id === account.id) : null;
  if (!member) {
    member = new Member();
    member.set({ family, name: name.trim(), memberType });
    if (account) member.set("user", account);
    if (birthday) member.set("birthDate", birthday);
    // Left out for the initial, so members can be saved before the database has the column.
    if (avatarIcon) member.set("avatarIcon", avatarIcon);
    member.setACL(createFamilyACL([...members.map(toMember), toMember(member)]));
    try {
      await member.save();
    } catch (error) {
      if (error.code === Parse.Error.DUPLICATE_VALUE) {
        throw new Error("That account already belongs to a family. If it was just added here, add the same username again to finish sharing.", { cause: error });
      }
      // The shared database doesn't let the app add columns (see the README's database setup).
      if (avatarIcon && error.code === Parse.Error.OPERATION_FORBIDDEN) {
        throw new Error("The member couldn't be saved with an icon. The database may still need the Member field avatarIcon (see the README's database setup). Choose the initial, or ask whoever manages the database to add it.", { cause: error });
      }
      throw error;
    }
    members.push(member);
  }

  if (account) {
    try {
      const savedFamily = await new Parse.Query(Family).get(family.id);
      const items = await new Parse.Query(Item).equalTo("family", family).findAll();
      const assignments = items.length
        ? await new Parse.Query("Assignment").containedIn("item", items).findAll()
        : [];
      const people = members.map(toMember);
      savedFamily.setACL(createFamilyACL(people));
      members.forEach((each) => each.setACL(createFamilyACL(people)));
      items.forEach((item) => item.setACL(createFamilyACL(people, true)));
      assignments.forEach((assignment) => assignment.setACL(createFamilyACL(people, true)));
      // Like shareList in the course examples, this is several saves, not a transaction.
      await Parse.Object.saveAll([savedFamily, ...members, ...items, ...assignments]);
    } catch (error) {
      throw new Error("The member exists, but sharing could not be updated. Add the same username again to retry.", { cause: error });
    }
  }
  return toMember(member);
}
