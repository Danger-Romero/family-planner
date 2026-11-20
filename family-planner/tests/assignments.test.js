import assert from "node:assert/strict";
import test from "node:test";
import { Parse, session, pointer, saved, memberRow, itemRow, assignmentRow } from "./parseMock.js";
import { loadAssignments, saveAssignments, deleteAssignments } from "../src/services/assignmentService.js";
import { deleteItem } from "../src/services/itemService.js";

const family = { id: "family1", name: "Our family" };
const responsible = { member: "member1", role: "responsible" };
const attending = { member: "member2", role: "attending" };

function membersWithChild() {
  const child = { ...memberRow("child", "member2"), name: "Zoe" };
  delete child.user;
  return [memberRow(), child];
}

function saveContextReply(api, members = membersWithChild()) {
  api.reply("GET", "classes/Item", (body) => {
    assert.equal(body.where.objectId, "item1");
    return { results: [itemRow()] };
  });
  api.reply("GET", "classes/Member", (body) => {
    assert.deepEqual(body.where.family, pointer("Family", "family1"));
    return { results: members };
  });
}

function assignmentsReply(api, rows) {
  api.reply("GET", "classes/Assignment", (body) => {
    assert.deepEqual(body.where.item, { $in: [pointer("Item", "item1")] });
    return { results: rows };
  });
}

function additionsReply(api, pairs, results = pairs.map((pair, index) => ({ success: saved("new" + index) })), acl = { owner: { read: true, write: true } }) {
  api.reply("POST", "batch", (body) => {
    assert.equal(body.transaction, undefined);
    assert.equal(body.requests.length, pairs.length);
    body.requests.forEach((request, index) => {
      assert.equal(request.method, "POST");
      assert.equal(request.path, "/parse/classes/Assignment");
      assert.deepEqual(request.body, {
        item: pointer("Item", "item1"), member: pointer("Member", pairs[index].member),
        role: pairs[index].role, ACL: acl,
      });
    });
    return results;
  });
}

function deletionQueryReply(api, rows) {
  api.reply("GET", "classes/Assignment", (body) => {
    assert.deepEqual(body.where.item, pointer("Item", "item1"));
    return { results: rows };
  });
}

function deletionsReply(api, ids, failedId = null) {
  api.reply("POST", "batch", (body) => {
    assert.deepEqual(body.requests.map((request) => request.path).sort(),
      ids.map((id) => "/parse/classes/Assignment/" + id).sort());
    return body.requests.map((request) => {
      assert.equal(request.method, "DELETE");
      return request.path.endsWith("/" + failedId)
        ? { error: { code: Parse.Error.OPERATION_FORBIDDEN, error: "Assignment delete denied" } }
        : { success: {} };
    });
  });
}

function plain(row) {
  return { id: row.objectId, item: row.item.objectId, member: row.member.objectId, role: row.role };
}

test("loading assignments for no Items makes no requests", async (t) => {
  const api = session(t);
  assert.deepEqual(await loadAssignments([]), []);
  assert.equal(api.calls.length, 0);
});

test("assignments load for the requested Items and return plain relationship IDs", async (t) => {
  const api = session(t);
  const rows = [assignmentRow(), assignmentRow("assignment2", "member2", "attending", "item2")];
  api.reply("GET", "classes/Assignment", (body) => {
    assert.deepEqual(body.where.item, { $in: [pointer("Item", "item1"), pointer("Item", "item2")] });
    return { results: rows };
  });
  assert.deepEqual(await loadAssignments([{ id: "item1" }, { id: "item2" }]), rows.map(plain));
});

test("assignment pagination retains the Item filter beyond 100 rows", async (t) => {
  const api = session(t);
  assignmentsReply(api, Array.from({ length: 100 }, (_, index) =>
    assignmentRow("assignment" + String(index).padStart(3, "0"), "member" + index),
  ));
  const last = assignmentRow("assignment100", "member100", "attending");
  api.reply("GET", "classes/Assignment", (body) => {
    assert.deepEqual(body.where.item, { $in: [pointer("Item", "item1")] });
    assert.deepEqual(body.where.objectId, { $gt: "assignment099" });
    return { results: [last] };
  });
  const assignments = await loadAssignments([{ id: "item1" }]);
  assert.equal(assignments.length, 101);
  assert.deepEqual(assignments[100], plain(last));
});

test("saving supports several members, both roles per member, and members without accounts", async (t) => {
  const api = session(t);
  const members = membersWithChild();
  members.push({ ...memberRow("child", "member3"), name: "Max", user: pointer("_User", "kid") });
  const pairs = [responsible, { member: "member1", role: "attending" },
    { member: "member2", role: "responsible" }, attending];
  const rows = pairs.map((pair, index) => assignmentRow("new" + index, pair.member, pair.role));
  saveContextReply(api, members);
  assignmentsReply(api, []);
  additionsReply(api, pairs, undefined, { owner: { read: true, write: true }, kid: { read: true, write: true } });
  assignmentsReply(api, rows);
  assert.deepEqual(await saveAssignments(family, "item1", [...pairs, responsible]), rows.map(plain));
});

test("an unchanged selection keeps the same Assignment IDs without writes", async (t) => {
  const api = session(t);
  const rows = [assignmentRow()];
  saveContextReply(api);
  assignmentsReply(api, rows);
  assignmentsReply(api, rows);
  assert.deepEqual(await saveAssignments(family, "item1", [responsible]), rows.map(plain));
  assert.ok(api.calls.every((call) => call.method === "GET"));
});

test("editing adds missing pairs before removing deselected pairs and retains unchanged IDs", async (t) => {
  const api = session(t);
  const kept = assignmentRow();
  const removed = assignmentRow("removed", "member2", "responsible");
  const added = assignmentRow("new0", "member1", "attending");
  const pair = { member: "member1", role: "attending" };
  saveContextReply(api);
  assignmentsReply(api, [kept, removed]);
  additionsReply(api, [pair]);
  deletionsReply(api, ["removed"]);
  assignmentsReply(api, [kept, added]);
  assert.deepEqual(await saveAssignments(family, "item1", [responsible, pair]), [kept, added].map(plain));
});

test("an empty selection removes all assignments from an Item", async (t) => {
  const api = session(t);
  saveContextReply(api);
  assignmentsReply(api, [assignmentRow(), assignmentRow("assignment2", "member2", "attending")]);
  deletionsReply(api, ["assignment1", "assignment2"]);
  assignmentsReply(api, []);
  assert.deepEqual(await saveAssignments(family, "item1", []), []);
});

test("unauthenticated assignment saves make no requests", async (t) => {
  const api = session(t);
  Parse.User._setCurrentUserCache(null);
  await assert.rejects(saveAssignments(family, "item1", [responsible]), /Log in/);
  assert.equal(api.calls.length, 0);
});

test("malformed family, Item, or selection arguments are rejected before requests", async (t) => {
  const api = session(t);
  for (const invalid of [null, {}, { id: "" }, { id: 1 }]) {
    await assert.rejects(saveAssignments(invalid, "item1", []), /item from your family/);
  }
  for (const invalid of [null, "", 1]) {
    await assert.rejects(saveAssignments(family, invalid, []), /item from your family/);
  }
  for (const invalid of [null, undefined, {}, "responsible"]) {
    await assert.rejects(saveAssignments(family, "item1", invalid), /assignment roles/);
  }
  assert.equal(api.calls.length, 0);
});

test("an Item from another family is rejected before loading or writing assignments", async (t) => {
  const api = session(t);
  api.reply("GET", "classes/Item", {
    results: [{ ...itemRow(), family: pointer("Family", "otherFamily") }],
  });
  await assert.rejects(saveAssignments(family, "item1", [responsible]), /item from your family/);
  assert.equal(api.calls.length, 1);
});

test("a signed-in account must have a Member in the selected family", async (t) => {
  const api = session(t);
  saveContextReply(api, [{ ...memberRow(), user: pointer("_User", "otherAccount") }]);
  await assert.rejects(saveAssignments(family, "item1", [responsible]), /not a member/);
  assert.ok(api.calls.every((call) => call.method === "GET"));
});

test("invalid roles and members outside the family cause no assignment writes", async (t) => {
  const api = session(t);
  for (const invalid of [null, {}, { member: "member1", role: "organiser" },
    { member: "otherFamilyMember", role: "attending" }, { role: "responsible" }]) {
    saveContextReply(api);
    await assert.rejects(saveAssignments(family, "item1", [responsible, invalid]), /Choose responsible or attending|members from your family/);
  }
  assert.ok(api.calls.every((call) => call.method === "GET" && call.path !== "classes/Assignment"));
});

test("a duplicate-value response reloads saved pairs before completing the change", async (t) => {
  const api = session(t);
  const old = assignmentRow("old", "member2", "attending");
  const concurrent = assignmentRow("concurrent");
  saveContextReply(api);
  assignmentsReply(api, [old]);
  additionsReply(api, [responsible], [{ error: { code: Parse.Error.DUPLICATE_VALUE, error: "Unique item/member/role" } }]);
  assignmentsReply(api, [old, concurrent]);
  deletionsReply(api, ["old"]);
  assignmentsReply(api, [concurrent]);
  assert.deepEqual(await saveAssignments(family, "item1", [responsible]), [plain(concurrent)]);
});

test("duplicate-value retries stop after one retry", async (t) => {
  const api = session(t);
  saveContextReply(api);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    assignmentsReply(api, []);
    additionsReply(api, [responsible], [{ error: { code: Parse.Error.DUPLICATE_VALUE, error: "Unique item/member/role" } }]);
  }
  await assert.rejects(saveAssignments(family, "item1", [responsible]), { code: Parse.Error.DUPLICATE_VALUE });
});

test("retrying a partially saved selection saves only missing pairs before deleting old ones", async (t) => {
  const api = session(t);
  const old = assignmentRow("old", "member1", "attending");
  const first = assignmentRow("new0");
  const second = assignmentRow("new1", "member2", "attending");
  saveContextReply(api);
  assignmentsReply(api, [old]);
  additionsReply(api, [responsible, attending], [
    { success: saved("new0") },
    { error: { code: Parse.Error.OPERATION_FORBIDDEN, error: "Save denied" } },
  ]);
  await assert.rejects(saveAssignments(family, "item1", [responsible, attending]), { code: Parse.Error.OPERATION_FORBIDDEN });
  assert.ok(api.calls.every((call) => !call.body?.requests?.some((request) => request.method === "DELETE")));

  saveContextReply(api);
  assignmentsReply(api, [old, first]);
  additionsReply(api, [attending], [{ success: saved("new1") }]);
  deletionsReply(api, ["old"]);
  assignmentsReply(api, [first, second]);
  assert.deepEqual(await saveAssignments(family, "item1", [responsible, attending]), [first, second].map(plain));
});

test("retrying a partially deleted selection removes only the remaining deselected pairs", async (t) => {
  const api = session(t);
  const kept = assignmentRow();
  const removed = assignmentRow("removed", "member2", "responsible");
  const failed = assignmentRow("failed", "member2", "attending");
  saveContextReply(api);
  assignmentsReply(api, [kept, removed, failed]);
  deletionsReply(api, ["removed", "failed"], "failed");
  await assert.rejects(saveAssignments(family, "item1", [responsible]), (error) => {
    assert.equal(error.code, Parse.Error.AGGREGATE_ERROR);
    assert.equal(error.errors[0].code, Parse.Error.OPERATION_FORBIDDEN);
    return true;
  });

  saveContextReply(api);
  assignmentsReply(api, [kept, failed]);
  deletionsReply(api, ["failed"]);
  assignmentsReply(api, [kept]);
  assert.deepEqual(await saveAssignments(family, "item1", [responsible]), [plain(kept)]);
});

test("deleting assignments for an unassigned Item requires no batch", async (t) => {
  const api = session(t);
  deletionQueryReply(api, []);
  await deleteAssignments("item1");
  assert.equal(api.calls.length, 1);
});

test("Item deletion destroys its assignments before destroying the Item", async (t) => {
  const api = session(t);
  deletionQueryReply(api, [assignmentRow(), assignmentRow("assignment2", "member2", "attending")]);
  deletionsReply(api, ["assignment1", "assignment2"]);
  api.reply("DELETE", "classes/Item/item1", {});
  await deleteItem("item1");
});

test("an Assignment lookup failure prevents deletion of its Item", async (t) => {
  const api = session(t);
  const failure = new Parse.Error(Parse.Error.CONNECTION_FAILED, "Lookup failed");
  api.reply("GET", "classes/Assignment", () => { throw failure; });
  await assert.rejects(deleteItem("item1"), (error) => error === failure);
  assert.equal(api.calls.length, 1);
});

test("partial assignment cleanup keeps the Item and a retry deletes only remaining rows", async (t) => {
  const api = session(t);
  const remaining = assignmentRow("assignment2", "member2", "attending");
  deletionQueryReply(api, [assignmentRow(), remaining]);
  deletionsReply(api, ["assignment1", "assignment2"], "assignment2");
  await assert.rejects(deleteItem("item1"), { code: Parse.Error.AGGREGATE_ERROR });
  assert.ok(api.calls.every((call) => call.path !== "classes/Item/item1"));

  deletionQueryReply(api, [remaining]);
  deletionsReply(api, ["assignment2"]);
  api.reply("DELETE", "classes/Item/item1", {});
  await deleteItem("item1");
});
