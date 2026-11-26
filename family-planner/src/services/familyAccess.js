import Parse from "./parse.js";

// Family and Member records can be changed by adults. Items can be changed
// by every linked account. Members without accounts need no ACL entry.
export function createFamilyACL(members, allMembersCanWrite = false) {
  const acl = new Parse.ACL();
  for (const member of members) {
    if (!member.user) continue;
    acl.setReadAccess(member.user, true);
    if (allMembersCanWrite || member.memberType === "adult") {
      acl.setWriteAccess(member.user, true);
    }
  }
  return acl;
}
