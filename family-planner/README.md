# Family planner

A React and JavaScript app built with Vite, using Parse/Back4App for accounts
and shared data. Adults can manage family members, and linked accounts can
create tasks and events, complete tasks, and view the family overview.

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
5. On **Items**, add a task with an optional due date, or an event with a
   required start and optional end. Tasks can be marked complete; both kinds
   can be deleted. **Overview** shows unfinished tasks and upcoming or ongoing
   events.

To add a person without a login, leave the username blank on the Family form.
This creates a member record without creating an account. Linking a login to
an existing member without an account is not implemented yet.

Each account can belong to one family. Changes from other people appear when
you refresh or revisit a page; the app has no live subscriptions. Date/time
inputs use your browser's local time.

## Shared database setup 

### 1. Classes and fields

Created `Family`, `Member`, and `Item` in Protected mode, then applied the
permissions below. Names are case-sensitive. Parse automatically adds
`objectId`, `createdAt`, `updatedAt`, and `ACL`.

| Class | Field | Type / purpose |
| --- | --- | --- |
| Family | `name` | String |
| Member | `family` | Pointer → Family |
| Member | `user` | Pointer → _User; optional, omit when there is no account |
| Member | `name` | String |
| Member | `memberType` | String: `adult` or `child` |
| Member | `birthDate` | Date; optional |
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

Every listed field is created before using the app, because client requests will
not be allowed to add columns. Authentication uses the built-in `_User` class.
The other classes in the [planned ER diagram](docs/er-diagram.mmd) are for
future features and are not required for setup.

### 2. Add the membership index

In Back4App's **Database → Index Manager**, create a **unique, sparse index
on `Member.user`**, or ask the database administrator to create it.

- **Unique** ensures that an account can only be linked to one member.
- **Sparse** allows multiple members without a login account.
- Members without an account must omit `user`, rather than store `null`.

The MongoDB field for this Parse pointer is `_p_user`; the dashboard may show
the logical name `user`. Verify that both Unique and Sparse are enabled.
Existing duplicate account links must be resolved before creating the index.

### 3. Configure class-level permissions (CLPs)

For the three planner classes, allow the following operations for
**authenticated users only**. Disable public access and client **Add Field**.

| Class | Authenticated operations |
| --- | --- |
| Family | Find, Get, Create, Update, Delete |
| Member | Find, Get, Create, Update, Delete |
| Item | Find, Get, Create, Update, Delete |

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
| Item | All linked family accounts | All linked family accounts |

Members without accounts have no login or ACL entry. Adding a linked account
updates access on the family's existing records.

Try the signup and sharing steps above with two separate accounts. Confirm
that the second adult can see existing items and add members. A linked child
can read and update items, but has no write access to Family or Member records.
An unrelated account should not be able to access the family's records.

Back4App enforces CLPs, ACLs, and the unique index. Adult-only member creation,
date validation, and checks on family/creator fields are implemented in browser
services and can be bypassed through direct API requests. This starter does
not enforce those rules on the server. Only `everyone` item visibility is
currently implemented.

## Development commands

Run these from `family-planner/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run service tests using the Parse SDK with mocked persistence |
| `npm run lint` | Run Oxlint |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build after building |

The automated tests do not configure or verify the hosted database index,
ACLs, or CLPs. Check sharing against the shared Back4App app as described above.

## Project structure

```text
src/
  App.jsx       # Login session, current member/family, and routes
  pages/        # Auth, Family, Items, Overview, and Setup pages
  components/   # Family/member forms and task/event forms and list entries
  services/     # Parse connection, accounts, families, members, items, and ACLs
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
| An account already belongs to a family | Each account can only have one member record. Use an unlinked account, or refresh if it was just added to this family. |
| Family creation reports unconfirmed membership | Refresh before retrying; the member may already have been saved. Check the database permissions if the error continues. |
| Login survives a server restart | Parse stores the session in browser localStorage. Log out before resetting test data; restarting Vite does not clear the session. |

Family creation and sharing use several saves. A connection failure can leave
partial data or access updates. Before retrying an add without a username,
refresh and check whether the member already exists. An empty family left by
a failed creation may need cleanup by the database administrator.
