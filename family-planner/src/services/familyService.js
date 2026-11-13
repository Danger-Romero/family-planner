import Parse from "./parse.js";
import { loadCurrentMember, toMember } from "./memberService.js";
import { createFamilyACL } from "./familyAccess.js";

const Family = Parse.Object.extend("Family");
const Member = Parse.Object.extend("Member");

function toFamily(family) {
  return { id: family.id, name: family.get("name") };
}

export async function loadFamily(id) {
  return toFamily(await new Parse.Query(Family).get(id));
}

export async function createFamily(name, memberName) {
  if (!name.trim() || !memberName.trim()) {
    throw new Error("Enter a family name and your name.");
  }

  const user = Parse.User.current();
  if (!user) throw new Error("Log in before creating a family.");

  const existing = await loadCurrentMember();
  if (existing) {
    return { family: await loadFamily(existing.family), member: existing };
  }

  const acl = createFamilyACL([{ user: user.id, memberType: "adult" }]);
  const family = new Family();
  family.set("name", name.trim());
  family.setACL(acl);
  await family.save();

  const member = new Member();
  member.set({
    family,
    user,
    name: memberName.trim(),
    memberType: "adult",
  });
  member.setACL(acl);
  try {
    await member.save();
  } catch (error) {
    if (error.code === Parse.Error.DUPLICATE_VALUE) {
      // A previous attempt may have saved the Member but lost its response.
      // Only remove this Family when the account is linked to a different one.
      const linked = await loadCurrentMember().catch(() => null);
      if (linked) {
        if (linked.family !== family.id) await family.destroy().catch(() => {});
        return { family: await loadFamily(linked.family), member: linked };
      }
      throw new Error("Your account already belongs to a family. Refresh to load it.", { cause: error });
    }
    // A lost response can mean the Member was saved. Keep its Family and refresh.
    throw new Error("The family was saved, but your membership could not be confirmed. Refresh before trying again and check the Back4App permissions.", { cause: error });
  }
  return { family: toFamily(family), member: toMember(member) };
}
