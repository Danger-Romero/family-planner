import assert from "node:assert/strict";
import test from "node:test";
import { Parse, session, timestamp, pointer, saved, familyRow, memberRow } from "./parseMock.js";
import { currentUser, signUp, logIn, logOut } from "../src/services/authService.js";
import { createFamily, loadFamily } from "../src/services/familyService.js";
import { loadCurrentMember, loadMembers, addMember } from "../src/services/memberService.js";
import { addItem, loadItems, setItemCompleted, deleteItem } from "../src/services/itemService.js";

const family = { id: "family1", name: "Our family" };
const member = {
  id: "member1", family: "family1", user: "owner", name: "Alice",
  memberType: "adult", birthDate: null, defaultSavedView: null,
};

function currentMemberReply(api, row = memberRow()) {
  api.reply("GET", "classes/Member", (body) => {
    assert.deepEqual(body.where.user, pointer("_User", "owner"));
    return { results: row ? [row] : [] };
  });
}

function familyReply(api, row = familyRow()) {
  api.reply("GET", "classes/Family", (body) => {
    assert.equal(body.where.objectId, row.objectId);
    return { results: [row] };
  });
}

function familyMembersReply(api, rows = [memberRow()]) {
  api.reply("GET", "classes/Member", (body) => {
    assert.deepEqual(body.where.family, pointer("Family", "family1"));
    return { results: rows };
  });
}

function accountReply(api, username = "Bob", objectId = "bob") {
  api.reply("GET", "classes/_User", (body) => {
    assert.equal(body.where.username, username);
    return { results: [{ objectId, username }] };
  });
}

const ownerACL = { owner: { read: true, write: true } };

function sharingReplies(api, memberType, memberId = "bobMember", failureCode = null) {
  familyReply(api);
  api.reply("GET", "classes/Item", (body) => {
    assert.deepEqual(body.where.family, pointer("Family", "family1"));
    return { results: [{
      objectId: "item1", title: "Milk", kind: "task", createdAt: timestamp,
      family: pointer("Family", "family1"), ACL: ownerACL,
    }] };
  });
  api.reply("POST", "batch", (body) => {
    assert.equal(body.transaction, undefined);
    const familyACL = { ...ownerACL, bob: memberType === "adult" ? { read: true, write: true } : { read: true } };
    const byPath = new Map(body.requests.map((request) => [request.path, request]));
    const expectedPaths = [
      "/parse/classes/Family/family1", "/parse/classes/Member/member1",
      "/parse/classes/Member/" + memberId, "/parse/classes/Item/item1",
    ];
    assert.deepEqual([...byPath.keys()].sort(), expectedPaths.sort());
    for (const path of expectedPaths) {
      const request = byPath.get(path);
      assert.equal(request.method, "PUT");
      const expectedACL = path.includes("/Item/")
        ? { ...ownerACL, bob: { read: true, write: true } }
        : familyACL;
      assert.deepEqual(request.body.ACL, expectedACL);
    }
    return body.requests.map((request, index) => failureCode && index === 1
      ? { error: { code: failureCode, error: "Member ACL update denied" } }
      : { success: { updatedAt: timestamp } });
  });
}

test("current membership returns a plain Member with relationship IDs", async (t) => {
  const api = session(t);
  api.reply("GET", "classes/Member", (body) => {
    assert.deepEqual(body.where.user, pointer("_User", "owner"));
    return { results: [memberRow()] };
  });
  assert.deepEqual(await loadCurrentMember(), member);

  api.reply("GET", "classes/Member", { results: [] });
  assert.equal(await loadCurrentMember(), null);
});

test("missing accounts have no current user or Member and make no requests", async (t) => {
  const api = session(t);
  Parse.User._setCurrentUserCache(null);
  assert.equal(currentUser(), null);
  assert.equal(await loadCurrentMember(), null);
  assert.equal(api.calls.length, 0);
});

test("a Family loads separately by its Member's family ID", async (t) => {
  const api = session(t);
  api.reply("GET", "classes/Family", (body) => {
    assert.equal(body.where.objectId, "family1");
    return { results: [familyRow()] };
  });
  assert.deepEqual(await loadFamily(member.family), family);
});

test("family pages load plain Members, including children without accounts", async (t) => {
  const api = session(t);
  const birthDate = new Date("2020-05-12T00:00:00.000Z");
  const child = {
    ...memberRow("child", "child1"), name: "Zoe",
    birthDate: { __type: "Date", iso: birthDate.toISOString() },
    defaultSavedView: pointer("SavedView", "view1"),
  };
  delete child.user;
  api.reply("GET", "classes/Member", (body) => {
    assert.deepEqual(body.where.family, pointer("Family", "family1"));
    return { results: [child, memberRow()] };
  });
  assert.deepEqual(await loadMembers(family), [member, {
    id: "child1", family: "family1", user: null, name: "Zoe",
    memberType: "child", birthDate, defaultSavedView: "view1",
  }]);
});

test("family creation explicitly returns its Family and first Member", async (t) => {
  const api = session(t);
  currentMemberReply(api, null);
  api.reply("POST", "classes/Family", (body) => {
    assert.equal(body.name, "Our family");
    assert.deepEqual(body.ACL, ownerACL);
    return saved("family1");
  });
  api.reply("POST", "classes/Member", (body) => {
    assert.equal(body.name, "Alice");
    assert.equal(body.memberType, "adult");
    assert.deepEqual(body.family, pointer("Family", "family1"));
    assert.deepEqual(body.user, pointer("_User", "owner"));
    assert.deepEqual(body.ACL, ownerACL);
    return saved("member1");
  });
  assert.deepEqual(await createFamily(" Our family ", " Alice "), { family, member });
});

test("creating a family again loads the existing membership without creating records", async (t) => {
  const api = session(t);
  currentMemberReply(api);
  familyReply(api);
  assert.deepEqual(await createFamily("Another", "Other name"), { family, member });
  assert.ok(api.calls.every((call) => call.method === "GET"));
});

test("an adult can save a child without an account or a user ACL entry", async (t) => {
  const api = session(t);
  currentMemberReply(api);
  familyMembersReply(api);
  api.reply("POST", "classes/Member", (body) => {
    assert.equal(body.name, "Zoe");
    assert.equal(body.memberType, "child");
    assert.equal(body.user, undefined);
    assert.deepEqual(body.family, pointer("Family", "family1"));
    assert.deepEqual(body.birthDate, { __type: "Date", iso: "2020-05-12T00:00:00.000Z" });
    assert.deepEqual(body.ACL, ownerACL);
    return saved("child1");
  });
  assert.deepEqual(await addMember({ name: " Zoe ", memberType: "child", birthDate: "2020-05-12" }), {
    id: "child1", family: "family1", user: null, name: "Zoe",
    memberType: "child", birthDate: new Date("2020-05-12T00:00:00.000Z"), defaultSavedView: null,
  });
});

test("linked adults manage family records and linked children can write Items", async (t) => {
  for (const memberType of ["adult", "child"]) {
    await t.test(memberType, async (t) => {
      const api = session(t);
      currentMemberReply(api);
      accountReply(api);
      familyMembersReply(api);
      api.reply("POST", "classes/Member", (body) => {
        assert.equal(body.name, "Bob");
        assert.equal(body.memberType, memberType);
        assert.deepEqual(body.user, pointer("_User", "bob"));
        assert.deepEqual(body.family, pointer("Family", "family1"));
        assert.deepEqual(body.ACL, {
          ...ownerACL, bob: memberType === "adult" ? { read: true, write: true } : { read: true },
        });
        return saved("bobMember");
      });
      sharingReplies(api, memberType);
      const added = await addMember({ name: "Bob", memberType, username: " Bob " });
      assert.equal(added.id, "bobMember");
      assert.equal(added.user, "bob");
    });
  }
});

test("children cannot use the member service to add other members", async (t) => {
  const api = session(t);
  currentMemberReply(api, memberRow("child"));
  await assert.rejects(addMember({ name: "Bob", memberType: "adult" }), /Only adult/);
  assert.ok(api.calls.every((call) => call.method === "GET"));
});

test("a failed sharing lookup leaves the saved Member and gives a retry instruction", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, "Family read denied");
  currentMemberReply(api);
  accountReply(api);
  familyMembersReply(api);
  api.reply("POST", "classes/Member", saved("bobMember"));
  api.reply("GET", "classes/Family", () => { throw failure; });
  await assert.rejects(addMember({ name: "Bob", memberType: "child", username: "Bob" }), (error) => {
    assert.match(error.message, /member exists.*same username.*retry/i);
    assert.equal(error.cause, failure);
    return true;
  });
  assert.equal(api.calls.filter((call) => call.method === "POST").length, 1);
  assert.ok(api.calls.every((call) => call.method !== "DELETE"));
});

test("a sharing batch with mixed success reports the saved Member and retry instruction", async (t) => {
  const api = session(t);
  currentMemberReply(api);
  accountReply(api);
  familyMembersReply(api);
  api.reply("POST", "classes/Member", saved("bobMember"));
  sharingReplies(api, "child", "bobMember", Parse.Error.OPERATION_FORBIDDEN);
  await assert.rejects(addMember({ name: "Bob", memberType: "child", username: "Bob" }), (error) => {
    assert.match(error.message, /member exists.*same username.*retry/i);
    assert.equal(error.cause.code, Parse.Error.OPERATION_FORBIDDEN);
    return true;
  });
  assert.ok(api.calls.every((call) => call.method !== "DELETE"));
});

test("retrying a linked account repairs all sharing without changing its name or type", async (t) => {
  const api = session(t);
  currentMemberReply(api);
  accountReply(api);
  familyMembersReply(api, [memberRow(), {
    ...memberRow("child", "bobMember"), name: "Original", user: pointer("_User", "bob"),
  }]);
  sharingReplies(api, "child");
  const result = await addMember({ name: "Changed", memberType: "adult", username: "Bob" });
  assert.equal(result.id, "bobMember");
  assert.equal(result.name, "Original");
  assert.equal(result.memberType, "child");
  assert.ok(api.calls.every((call) => call.path !== "classes/Member" || call.method === "GET"));
});

test("duplicate account membership rejects an invitation without granting sharing", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.DUPLICATE_VALUE, "Unique Member.user index");
  currentMemberReply(api);
  accountReply(api);
  familyMembersReply(api);
  api.reply("POST", "classes/Member", () => { throw failure; });
  await assert.rejects(addMember({ name: "Bob", memberType: "adult", username: "Bob" }), (error) => {
    assert.match(error.message, /already belongs to a family/);
    assert.equal(error.cause, failure);
    return true;
  });
});

test("a confirmed membership in another family cleans up only the unused new Family", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.DUPLICATE_VALUE, "Unique Member.user index");
  currentMemberReply(api, null);
  api.reply("POST", "classes/Family", saved("unusedFamily"));
  api.reply("POST", "classes/Member", () => { throw failure; });
  currentMemberReply(api);
  api.reply("DELETE", "classes/Family/unusedFamily", {});
  familyReply(api);
  assert.deepEqual(await createFamily("Our family", "Alice"), { family, member });
});

test("a duplicate response for a Member saved in this Family keeps that Family", async (t) => {
  const api = session(t);
  currentMemberReply(api, null);
  api.reply("POST", "classes/Family", saved("family1"));
  api.reply("POST", "classes/Member", () => {
    throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, "Repeated Member save after lost response");
  });
  currentMemberReply(api);
  familyReply(api);
  assert.deepEqual(await createFamily("Our family", "Alice"), { family, member });
  assert.ok(api.calls.every((call) => call.method !== "DELETE"));
});

test("a duplicate with unreadable membership keeps the Family and asks for refresh", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.DUPLICATE_VALUE, "Unique Member.user index");
  currentMemberReply(api, null);
  api.reply("POST", "classes/Family", saved("family1"));
  api.reply("POST", "classes/Member", () => { throw failure; });
  currentMemberReply(api, null);
  await assert.rejects(createFamily("Our family", "Alice"), (error) => {
    assert.match(error.message, /already belongs.*Refresh/);
    assert.equal(error.cause, failure);
    return true;
  });
  assert.ok(api.calls.every((call) => call.method !== "DELETE"));
});

test("an ambiguous Member save failure keeps the Family and asks the user to refresh", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.CONNECTION_FAILED, "Connection lost");
  currentMemberReply(api, null);
  api.reply("POST", "classes/Family", saved("family1"));
  api.reply("POST", "classes/Member", () => { throw failure; });
  await assert.rejects(createFamily("Our family", "Alice"), (error) => {
    assert.match(error.message, /membership could not be confirmed.*Refresh/);
    assert.equal(error.cause, failure);
    return true;
  });
  assert.ok(api.calls.every((call) => call.method !== "DELETE"));
});

test("one Item query loads both kinds and keeps its family filter across pages", async (t) => {
  const api = session(t);
  const relationshipFields = {
    family: pointer("Family", "family1"), createdBy: pointer("Member", "member1"),
  };
  api.reply("GET", "classes/Item", (body) => {
    assert.deepEqual(body.where, { family: pointer("Family", "family1") });
    return { results: Array.from({ length: 100 }, (_, index) => ({
      objectId: "item" + String(index).padStart(3, "0"),
      kind: index % 2 ? "event" : "task", title: "Item", completed: false,
      createdAt: timestamp, ...relationshipFields,
    })) };
  });
  api.reply("GET", "classes/Item", (body) => {
    assert.equal(body.where.kind, undefined);
    assert.deepEqual(body.where.family, pointer("Family", "family1"));
    assert.deepEqual(body.where.objectId, { $gt: "item099" });
    return { results: [{
      objectId: "item100", kind: "task", title: "Earlier", completed: true,
      createdAt: "2026-11-01T10:00:00Z", ...relationshipFields,
    }] };
  });
  const items = await loadItems(family);
  assert.equal(items.length, 101);
  assert.equal(items[0].title, "Earlier");
  assert.equal(items[0].completed, true);
  assert.equal(items[0].family, "family1");
  assert.equal(items[0].createdBy, "member1");
  assert.equal(items.filter((item) => item.kind === "event").length, 50);
});

test("Item writes serialize plain relationships and task/event dates", async (t) => {
  const api = session(t);
  const start = new Date("2026-11-06T18:00:00+01:00");
  const end = new Date("2026-11-06T19:00:00+01:00");
  const child = { ...memberRow("child", "child1"), name: "Zoe", user: pointer("_User", "kid") };
  const withoutAccount = { ...memberRow("child", "child2"), name: "Max" };
  delete withoutAccount.user;
  familyMembersReply(api, [memberRow(), child, withoutAccount]);
  api.reply("POST", "classes/Item", (body) => {
    assert.equal(body.kind, "task");
    assert.equal(body.title, "Buy milk");
    assert.equal(body.completed, false);
    assert.equal(body.visibility, "everyone");
    assert.equal(body.note, "");
    assert.equal(body.allDay, false);
    assert.equal(body.manuallyUrgent, false);
    assert.deepEqual(body.ACL, { ...ownerACL, kid: { read: true, write: true } });
    assert.deepEqual(body.family, pointer("Family", "family1"));
    assert.deepEqual(body.createdBy, pointer("Member", "member1"));
    assert.deepEqual(body.dueAt, { __type: "Date", iso: start.toISOString() });
    assert.equal(body.text, undefined);
    assert.equal(body.done, undefined);
    return saved("task1");
  });
  const task = await addItem(family, member, { kind: "task", title: " Buy milk ", dueAt: start });
  assert.equal(task.id, "task1");
  assert.equal(task.family, "family1");
  assert.equal(task.createdBy, "member1");
  assert.equal(task.dueAt.getTime(), start.getTime());
  assert.equal(task.startsAt, null);
  assert.equal(task.endsAt, null);

  familyMembersReply(api, [memberRow(), child, withoutAccount]);
  api.reply("POST", "classes/Item", (body) => {
    assert.equal(body.kind, "event");
    assert.deepEqual(body.family, pointer("Family", "family1"));
    assert.deepEqual(body.createdBy, pointer("Member", "member1"));
    assert.deepEqual(body.ACL, { ...ownerACL, kid: { read: true, write: true } });
    assert.deepEqual(body.startsAt, { __type: "Date", iso: start.toISOString() });
    assert.deepEqual(body.endsAt, { __type: "Date", iso: end.toISOString() });
    assert.equal(body.date, undefined);
    return saved("event1");
  });
  const event = await addItem(family, member, { kind: "event", title: "Dinner", startsAt: start, endsAt: end });
  assert.equal(event.id, "event1");
  assert.equal(event.kind, "event");
  assert.equal(event.dueAt, null);
  assert.equal(event.startsAt.getTime(), start.getTime());
  assert.equal(event.endsAt.getTime(), end.getTime());
});

test("Item creation verifies the current account owns the selected Member", async (t) => {
  const api = session(t);
  familyMembersReply(api, [{ ...memberRow(), user: pointer("_User", "otherAccount") }]);
  await assert.rejects(addItem(family, member, { kind: "task", title: "Milk" }), /not a member/);
  assert.ok(api.calls.every((call) => call.method === "GET"));
});

test("validation prevents blank input, invalid kinds/dates and cross-family creators", async (t) => {
  const api = session(t);
  await assert.rejects(createFamily(" ", "Alice"), /family name/);
  await assert.rejects(addMember({ name: " ", memberType: "adult" }), /member name/);
  await assert.rejects(addMember({ name: "Zoe", memberType: "admin" }), /adult or child/);
  await assert.rejects(addMember({ name: "Zoe", memberType: "child", birthDate: "2020-02-31" }), /valid birth date/);
  await assert.rejects(addItem(family, member, { kind: "task", title: " " }), /title/);
  await assert.rejects(addItem(family, member, { kind: "reminder", title: "Milk" }), /task or event/);
  await assert.rejects(addItem(family, member, { kind: "task", title: "Milk", dueAt: new Date("invalid") }), /due date/);
  await assert.rejects(addItem(family, member, { kind: "event", title: "Dinner", startsAt: new Date("invalid") }), /event start/);
  await assert.rejects(addItem(family, member, { kind: "event", title: "Dinner" }), /event start/);
  await assert.rejects(addItem(family, member, {
    kind: "event", title: "Dinner", startsAt: new Date(timestamp), endsAt: new Date(timestamp),
  }), /end must/);
  await assert.rejects(addItem(family, member, {
    kind: "event", title: "Dinner", startsAt: new Date(timestamp), endsAt: new Date("invalid"),
  }), /end must/);
  await assert.rejects(addItem({ id: "other", name: "Other family" }, member, { kind: "task", title: "Milk" }), /from your family/);
  assert.equal(api.calls.length, 0);
});

test("unauthenticated creation makes no requests", async (t) => {
  const api = session(t);
  Parse.User._setCurrentUserCache(null);
  await assert.rejects(createFamily("Our family", "Alice"), /Log in/);
  await assert.rejects(addMember({ name: "Zoe", memberType: "child" }), /Log in/);
  await assert.rejects(addItem(family, member, { kind: "task", title: "Milk" }), /Log in/);
  assert.equal(api.calls.length, 0);
});

test("write failures propagate and completion changes only Item.completed", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "No write access");
  api.reply("PUT", "classes/Item/item1", (body) => {
    assert.deepEqual(body, { completed: true });
    throw failure;
  });
  await assert.rejects(setItemCompleted("item1", true), (error) => error === failure);
  api.reply("DELETE", "classes/Item/item2", () => { throw failure; });
  await assert.rejects(deleteItem("item2"), (error) => error === failure);
  familyMembersReply(api);
  api.reply("POST", "classes/Item", () => { throw failure; });
  await assert.rejects(addItem(family, member, { kind: "task", title: "Milk" }), (error) => error === failure);
  currentMemberReply(api);
  familyMembersReply(api);
  api.reply("POST", "classes/Member", () => { throw failure; });
  await assert.rejects(addMember({ name: "Bob", memberType: "adult" }), (error) => error === failure);
});

test("signup allows username lookup while keeping account writes with its owner", async (t) => {
  const api = session(t);
  api.reply("POST", "users", (body) => {
    assert.equal(body.username, "Alice");
    assert.equal(body.ACL, undefined);
    return { ...saved("newUser"), sessionToken: "new-session", ACL: { newUser: { read: true, write: true } } };
  });
  api.reply("PUT", "classes/_User/newUser", (body) => {
    assert.deepEqual(body, { ACL: { newUser: { read: true, write: true }, "*": { read: true } } });
    return { updatedAt: timestamp };
  });
  assert.deepEqual(await signUp(" Alice ", "test-password"), { id: "newUser", username: "Alice", email: null });
  assert.deepEqual(currentUser(), { id: "newUser", username: "Alice", email: null });
  const acl = Parse.User.current().getACL();
  assert.equal(acl.getPublicReadAccess(), true);
  assert.equal(acl.getPublicWriteAccess(), false);
  assert.equal(acl.getWriteAccess("newUser"), true);
});

test("signup reports when the account exists but its sharing permissions failed", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, "ACL update denied");
  api.reply("POST", "users", { ...saved("newUser"), sessionToken: "new-session" });
  api.reply("PUT", "classes/_User/newUser", () => { throw failure; });
  await assert.rejects(signUp("Alice", "test-password"), (error) => {
    assert.match(error.message, /account was created.*sharing permissions/i);
    assert.ok(error.message.includes(String(failure.code)));
    assert.ok(error.message.includes(failure.message));
    assert.equal(error.cause, failure);
    return true;
  });
  assert.equal(currentUser().id, "newUser");
});

test("login returns only account identity and optional email", async (t) => {
  const api = session(t);
  api.reply("POST", "login", (body) => {
    assert.equal(body.username, "Bob");
    assert.equal(body.password, "test-password");
    return { objectId: "bob", username: "Bob", email: "bob@example.com", sessionToken: "bob-session" };
  });
  const user = await logIn(" Bob ", "test-password");
  assert.deepEqual(user, { id: "bob", username: "Bob", email: "bob@example.com" });
  assert.deepEqual(currentUser(), user);
});

async function storedLogin(api) {
  api.reply("POST", "login", {
    objectId: "owner", username: "Alice", sessionToken: "r:test-session",
  });
  await logIn("Alice", "test-password");
  const storage = Parse.CoreManager.getStorageController();
  const key = storage.getAllKeys().find((key) => key.endsWith("/currentUser"));
  assert.ok(key, "The SDK persists the signed-in user.");
  assert.equal(JSON.parse(storage.getItem(key)).sessionToken, "r:test-session");
  return { storage, key };
}

function assertLocalLogout(storage, key) {
  assert.equal(currentUser(), null);
  assert.equal(storage.getItem(key), null);
  Parse.User._clearCache();
  assert.equal(currentUser(), null, "Reloading the SDK cannot restore the old user.");
}

test("logout clears the cached user and persisted login", async (t) => {
  const api = session(t);
  const { storage, key } = await storedLogin(api);
  api.reply("POST", "logout", {});
  await logOut();
  assertLocalLogout(storage, key);
});

test("logout of a deleted or revoked server session still clears the local login", async (t) => {
  const api = session(t);
  const { storage, key } = await storedLogin(api);
  api.reply("POST", "logout", () => {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "Invalid session token");
  });
  await logOut();
  assertLocalLogout(storage, key);
});

test("logout preserves unrelated network and permission errors", async (t) => {
  for (const code of [Parse.Error.CONNECTION_FAILED, Parse.Error.OPERATION_FORBIDDEN]) {
    await t.test(String(code), async (t) => {
      const api = session(t);
      const { storage, key } = await storedLogin(api);
      const failure = new Parse.Error(code, "Logout request failed");
      api.reply("POST", "logout", () => { throw failure; });
      await assert.rejects(logOut(), (error) => error === failure);
      assertLocalLogout(storage, key);
    });
  }
});
