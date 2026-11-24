# Family planner

A React and JavaScript app built with Vite, using Parse/Back4App for accounts
and shared data. Adults can manage family members, and linked accounts can
create tasks and events, assign responsible and attending members, complete
tasks, and see the family's day on the Today page.

The group uses **one shared Back4App app**. Each member runs the frontend
locally and connects to that same backend. The [database setup](#shared-database-setup-once-per-group)
only needs to be completed once for the group.

## Local setup (each group member)

You need Node.js **22.12 or newer**, npm, and a copy of this repository.
Ask the group for the shared Back4App Application ID, JavaScript key, and
server URL before starting.

1. Open a terminal at the repository root, enter this project, and install the
   dependencies from the lockfile:

   ```sh
   cd family-planner
   npm ci
   ```

2. Copy the environment template:

   ```sh
   cp .env.example .env.local
   ```

   In Windows PowerShell, use `Copy-Item .env.example .env.local`.

3. Open `.env.local` and replace the placeholders with the shared app's values:

   ```dotenv
   VITE_PARSE_SERVER_URL=https://parseapi.back4app.com
   VITE_PARSE_APP_ID=your-application-id-here
   VITE_PARSE_JS_KEY=your-javascript-key-here
   ```

   These are available in Back4App under **App Settings → Security & Keys**.
   Use the server URL for the shared app. `.env.local` is ignored by Git;
   keep it local. Use the **JavaScript key**, never the master key. Values
   prefixed with `VITE_` are included in the frontend.

4. Once the shared database is configured, start the app:

   ```sh
   npm run dev
   ```

   Open the local URL printed in the terminal. Stop the server with `Ctrl+C`.
   Restart it whenever you change `.env.local`.

## Try the app together

1. The first person signs up, creates a family, and enters their own name.
   They become the family's first adult member.
2. Other group members sign up with their own usernames. If you are joining
   the shared family, leave the create-family form blank and wait to be added.
3. The first adult opens **Family** and adds each person using their name,
   member type, and exact signup username. Choose **adult** for group members
   who need to manage members. Add accounts one at a time.
4. Each added person refreshes the page to load the shared family.
5. On **Today**, tap **+** to add a task: a title, an optional due date and
   time, **Flag as urgent**, and the members who are **Responsible** and
   **Attending**. Tap a task to change any of these, and tick its box to mark it
   done. Events are added on the items page (`/items`): an event has a required
   start and optional end. There, **Edit assignments** changes who is on an
   item, and both kinds can be deleted.
6. **Today** shows unfinished tasks and upcoming or ongoing events, including
   the names assigned to each role. Log out from **Family** to switch accounts.

To add a person without a login, leave the username blank on the Family form.
This creates a member record without creating an account. Linking a login to
an existing member without an account is not implemented yet.

Each account can belong to one family. Changes from other people appear when
you refresh or revisit a page; the app has no live subscriptions. Date/time
inputs use your browser's local time.

### Responsible and attending

An item can have several responsible members and several attending members.
The same member can have both roles. Members without accounts can be assigned,
and assignments are optional; existing items start unassigned.

Each member/role pair is a separate `Assignment` record pointing to an `Item`
and a `Member`. The [ER diagram](docs/er-diagram.mmd) shows these relationships.
`Item.createdBy` still identifies the creator. Assignment roles describe who is
responsible or attending; they do not change account permissions.

### If saving or deleting fails

The item is saved before its assignments. If assignment creation fails, the
saved item stays in the list and the creation form resets. Use **Edit
assignments** on that item to finish; creating it again would make another item.

Editing saves new pairs before deleting deselected pairs and keeps unchanged
records. A failed edit keeps your selections in the open form and tries to
reload the stored assignments. Retry **Save assignments** to finish the change.
Each retry reads the stored pairs again, so successful parts are reused. A
duplicate-value error triggers one automatic retry. Other failures are shown
for a manual retry. These saves are several requests, not one transaction.

Deleting an item deletes its assignments first. A failure can leave the item
with fewer assignments, so the page reloads the stored data before another
attempt. Follow any refresh instruction if that reload also fails. This cleanup
runs in the app; deleting an Item directly in the dashboard does not run it.

## Shared database setup (once per group)

### 1. Classes and fields

Create `Family`, `Member`, `Item`, and `Assignment` in Protected mode, then apply
the permissions below. If a class already exists, check its fields and settings.
Names are case-sensitive. Parse automatically adds
`objectId`, `createdAt`, `updatedAt`, and `ACL`.

| Class | Field | Type / purpose |
| --- | --- | --- |
| Family | `name` | String |
| Member | `family` | Pointer → Family |
| Member | `user` | Pointer → _User; optional, omit when there is no account |
| Member | `name` | String |
| Member | `memberType` | String: `adult` or `child` |
| Member | `birthDate` | Date; optional |
| Member | `avatarIcon` | String; optional, an icon name such as `pets`; omit for the initial |
| Item | `family` | Pointer → Family |
| Item | `createdBy` | Pointer → Member |
| Item | `kind` | String: `task` or `event` |
| Item | `title` | String |
| Item | `note` | String; initially empty |
| Item | `dueAt` | Date; optional, tasks only |
| Item | `startsAt` | Date; required for events |
| Item | `endsAt` | Date; optional, after `startsAt` |
| Item | `allDay` | Boolean; initially `false` |
| Item | `manuallyUrgent` | Boolean; initially `false` |
| Item | `completed` | Boolean; initially `false` |
| Item | `visibility` | String; currently `everyone` |
| Assignment | `item` | Pointer → Item |
| Assignment | `member` | Pointer → Member |
| Assignment | `role` | String: `responsible` or `attending` |

Every listed field is created before using the app, because client requests will
not be allowed to add columns. Authentication uses the built-in `_User` class.
The remaining classes in the [ER diagram](docs/er-diagram.mmd) are for future
features and are not required for setup. See the official
[Back4App Database Browser guide](https://www.back4app.com/docs/parse-dashboard/core/database-browser)
for class, column, security, and index controls.

### 2. Add the indexes

In Back4App's **Database → Index Manager**, create a **unique, sparse index
on `Member.user`**, or ask the database administrator to create it.

- **Unique** ensures that an account can only be linked to one member.
- **Sparse** allows multiple members without a login account.
- Members without an account must omit `user`, rather than store `null`.

The MongoDB field for this Parse pointer is `_p_user`; the dashboard may show
the logical name `user`. Verify that both Unique and Sparse are enabled.
Existing duplicate account links must be resolved before creating the index.

For `Assignment`, create a **unique compound index** on `item`, `member`, and
`role`, with all three fields ascending. A suggested name is
`unique_item_member_role`. For a MongoDB-backed Parse app, the index keys are:

```json
{ "_p_item": 1, "_p_member": 1, "role": 1 }
```

Set **Unique** to true and leave **Sparse** off. This prevents duplicate pairs
for the same item while allowing one member to have both roles. A normal
non-unique index does not provide that protection. Remove existing duplicate
triples before creating the index. If Index Manager does not offer the required
unique options, ask the app's administrator or Back4App support to create it.

Parse documents the `_p_` names for
[pointer indexes](https://docs.parseplatform.org/defined-schema/guide/#indexes).
MongoDB documents [compound unique indexes](https://www.mongodb.com/docs/manual/core/index-unique/)
and why existing duplicates must be resolved first.

### 3. Configure class-level permissions (CLPs)

For the four planner classes, allow the following operations for
**authenticated users only**. Disable public access and client **Add Field**.

| Class | Authenticated operations |
| --- | --- |
| Family | Find, Get, Create, Update, Delete |
| Member | Find, Get, Create, Update, Delete |
| Item | Find, Get, Create, Update, Delete |
| Assignment | Find, Get, Create, Update, Delete |

For `_User`, use these permissions:

| Operation | Allow |
| --- | --- |
| Create | Public, so signed-out users can sign up |
| Find, Get | Authenticated users, for username lookup |
| Update | Authenticated users, so accounts can save their sharing ACL |
| Delete, Add Field | Disabled for clients |

Keep each account's write ACL restricted to its own `objectId` and retain
Parse's default email protections. New signups receive owner read/write and
public read ACL entries; the authenticated Find/Get CLPs restrict username
lookup to signed-in users. Existing accounts with private read ACLs need the
same read access before they can be found by username. Keep private profile
data out of these readable account records.

### 4. Check sharing

The services assign record access control lists (ACLs) automatically:

| Records | Read access | Write access |
| --- | --- | --- |
| Family and Member | All linked family accounts | Linked adult accounts |
| Item and Assignment | All linked family accounts | All linked family accounts |

Members without accounts have no login or ACL entry, but they can still be
assigned. Adding a linked account updates access on the family's existing
Family, Member, Item, and Assignment records. If sharing fails, adding the same
username again repairs access without creating another Member.

Try the signup and sharing steps above with two separate accounts. Confirm
that the second adult can see existing items and add members. A linked child
can read and update items and assignments, but has no write access to existing
Family or Member records.
An unrelated account should not be able to access the family's records.

Back4App enforces the configured CLPs, ACLs, and unique indexes. Adult-only
member creation, date validation, allowed assignment roles, and checks that an
item, creator, and assigned members belong to the selected family are implemented
in browser services. Direct API requests can bypass these service checks. A
String column does not enforce allowed role values. Use server-side validation
if those rules must be enforced against direct requests. Only `everyone` item
visibility is currently implemented.

### 5. Verify against the shared Back4App app

Run these checks with your group's accounts after configuring the database:

1. Create a task and an event. Select several members in each role, including a
   member without an account. Give one member both roles. Refresh and confirm
   that **Manage items** and **Today** show the names under the correct labels.
2. Inspect `Assignment` in the dashboard. Each selected item/member/role triple
   should have one record. A member with both roles should have two records.
   Confirm the unique index exists; repeated saves should keep the same IDs for
   unchanged pairs.
3. Edit assignments: add a member, remove a member, then clear both groups.
   Refresh after each save and confirm the stored rows match the selections.
4. Add a new linked adult and child after assignments exist. In separate browser
   sessions, confirm both accounts can read the existing assignments and edit
   them. Confirm the adult can add members. Check the child has no write ACL
   on existing Family or Member records.
5. With an unrelated account's normal session, try reading and writing known
   Family, Item, and Assignment IDs through the SDK/API. Reads must return no
   accessible record and writes must fail. Dashboard administrator access does
   not test the permissions of an ordinary account.
6. Delete an assigned item through the app. Refresh and check the dashboard:
   the Item and its Assignment records should be gone.
7. On **Today**, tap a task and change its title, remove its due date, flag it
   and swap who is responsible. Refresh: the task should be under **Urgent**
   with the new title and people, and in the dashboard its `dueAt` should be
   empty and `manuallyUrgent` true. Then add a task with **+** and confirm it
   appears after a refresh.

Partial saves, retries, and cleanup failures are also covered by the automated
tests below. Those tests replace the network; they do not verify hosted settings.

## Development commands

Run these from `family-planner/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run service tests using the Parse SDK with mocked persistence |
| `npm run lint` | Run Oxlint |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build after building |

The automated tests use the actual Parse SDK with mocked network responses.
They cover assignment validation, both roles, members without accounts,
pagination, partial-save retries, deletion order, and sharing ACL requests.
They do not configure or verify hosted indexes, ACL enforcement, CLPs, or the
browser interface. Run the live checks above separately.

## Project structure

```text
src/
  App.jsx       # Login session, current member/family, and routes
  pages/        # Today, Auth, Family, Items, Overview, and Setup pages
  components/   # Family/member forms, item entries, and assignment forms/fields
  services/     # Parse connection, accounts, families, members, items, assignments, ACLs
tests/          # Service tests and Parse persistence mock
docs/           # Planned ER diagram
```

Pages load data through services. Forms keep their own input state and pass
values through callback props. Services return plain JavaScript objects;
Parse objects stay inside the service layer. An object's `id` is its Parse
`objectId`, pointer fields become referenced IDs, and date fields become
JavaScript `Date` objects or `null`.

Tasks and events both use `Item`, distinguished by `kind`. Coordinate changes
to the shared Item fields, `itemService.js`, components, and routes when
dividing work between group members.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| The app shows “Connect Back4App” | Fill in all three values in `.env.local`, replace the placeholders, and restart Vite. |
| Signup says sharing permissions could not be saved | The account was created. Check `_User` Update permissions, then use **Log in** with that account. |
| A username cannot be found | The person must sign up first. Check the exact username, `_User` Find/Get permissions, and the account's read ACL. |
| An added account cannot see the family | Refresh its page. If sharing failed, an adult can add the same username again to repair access without creating another member. |
| Assignments fail to load or save | Check the case-sensitive `Assignment` class and its pointer types, authenticated CLPs, record ACLs, and unique compound index. |
| An item was created but its assignments failed | Use **Edit assignments** on the saved item and retry. Do not create the item again. |
| A newly linked account cannot see old assignments | An adult can add the same username again to repair sharing, then refresh the other account's page. |
| An account already belongs to a family | Each account can only have one member record. Use an unlinked account, or refresh if it was just added to this family. |
| Family creation reports unconfirmed membership | Refresh before retrying; the member may already have been saved. Check the database permissions if the error continues. |
| Login survives a server restart | Parse stores the session in browser localStorage. Log out before resetting test data; restarting Vite does not clear the session. |

Family creation and sharing use several saves. A connection failure can leave
partial data or access updates. Before retrying an add without a username,
refresh and check whether the member already exists. An empty family left by
a failed creation may need cleanup by the database administrator.
