import Parse from "./parse.js";

function toUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.get("username"),
    email: user.get("email") ?? null,
  };
}

export function currentUser() {
  return toUser(Parse.User.current());
}

export function isInvalidSession(error) {
  return error?.code === Parse.Error.INVALID_SESSION_TOKEN;
}

export async function signUp(username, password) {
  const name = username.trim();
  if (!name || !password) throw new Error("Enter a username and password.");

  const user = new Parse.User();
  user.set("username", name);
  user.set("password", password);
  await user.signUp();

  // Other signed-in accounts need to find this username to add it to a family.
  const acl = new Parse.ACL(user);
  acl.setPublicReadAccess(true);
  user.setACL(acl);

  try {
    await user.save();
  } catch (error) {
    const code = error.code == null ? "" : ` (${error.code})`;
    throw new Error(
      `Your account was created, but sharing permissions could not be saved. Back4App${code}: ${error.message || "Unknown error"}. Use Log in for this account instead of signing up again.`,
      { cause: error },
    );
  }

  return toUser(user);
}

export async function logIn(username, password) {
  return toUser(await Parse.User.logIn(username.trim(), password));
}

export async function logOut() {
  try {
    await Parse.User.logOut();
  } catch (error) {
    // The SDK already cleared its local user. A deleted server session is logged out.
    if (!isInvalidSession(error)) throw error;
  }
}
