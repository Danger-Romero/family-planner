import assert from "node:assert/strict";
import Parse from "../src/services/parse.js";
export { Parse };

export const timestamp = "2026-11-05T10:00:00.000Z";
export const pointer = (className, objectId) => ({ __type: "Pointer", className, objectId });
export const saved = (objectId) => ({ objectId, createdAt: timestamp });

Parse.initialize("family-planner-service-tests", "unused-test-key");
Parse.serverURL = "https://example.invalid/parse";
Parse.User.enableUnsafeCurrentUser();

// Only the network boundary is replaced. The actual Parse SDK still builds
// objects, serializes pointers/ACLs/relations/dates, and decodes query results.
// These tests verify our requests; live server ACL enforcement is a manual check.
export function session(t) {
  Parse.CoreManager.getObjectStateController().clearAllState();
  Parse.User._clearCache();

  // The application imports Parse's browser build, which normally uses localStorage.
  const originalStorage = Parse.CoreManager.getStorageController();
  const values = new Map();
  Parse.CoreManager.setStorageController({
    async: 0,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    getAllKeys: () => [...values.keys()],
  });

  const owner = Parse.Object.fromJSON({
    className: "_User",
    objectId: "owner",
    username: "Alice",
    sessionToken: "test-session",
  });
  Parse.User._setCurrentUserCache(owner);

  const original = Parse.CoreManager.getRESTController();
  const pending = [];
  const calls = [];
  Parse.CoreManager.setRESTController({
    ajax() {
      throw new Error("Tests must not make network requests.");
    },
    async request(method, path, body) {
      calls.push({ method, path, body: structuredClone(body) });
      const expected = pending.shift();
      assert.ok(expected, `Unexpected request: ${method} ${path}`);
      assert.equal(method, expected.method);
      assert.equal(path, expected.path);
      return typeof expected.response === "function"
        ? expected.response(body)
        : structuredClone(expected.response);
    },
  });
  t.after(() => {
    Parse.CoreManager.setRESTController(original);
    Parse.CoreManager.setStorageController(originalStorage);
    Parse.User._clearCache();
    assert.equal(pending.length, 0, "Every expected request should run.");
  });

  return {
    owner,
    calls,
    reply(method, path, response) {
      pending.push({ method, path, response });
    },
  };
}

export function familyRow() {
  return {
    className: "Family", __type: "Object", objectId: "family1", name: "Our family",
    ACL: { owner: { read: true, write: true } }, createdAt: timestamp,
  };
}

export function memberRow(memberType = "adult", objectId = "member1") {
  return {
    className: "Member", __type: "Object", objectId,
    name: "Alice", memberType, family: familyRow(),
    user: pointer("_User", "owner"), ACL: { owner: { read: true, write: true } }, createdAt: timestamp,
  };
}
