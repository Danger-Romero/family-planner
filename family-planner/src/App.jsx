import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import FamilyPage from "./pages/FamilyPage.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import ItemsPage from "./pages/ItemsPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";
import { parseConfigured } from "./services/parse.js";
import { currentUser, isInvalidSession, logOut } from "./services/authService.js";
import { createFamily, loadFamily } from "./services/familyService.js";
import { loadCurrentMember } from "./services/memberService.js";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(() => parseConfigured ? currentUser() : null);
  const [member, setMember] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user || !parseConfigured) return;
      setLoading(true);
      setError("");
      try {
        const loadedMember = await loadCurrentMember();
        const loadedFamily = loadedMember ? await loadFamily(loadedMember.family) : null;
        if (active) {
          setMember(loadedMember);
          setFamily(loadedFamily);
        }
      } catch (error) {
        if (!active) return;
        if (isInvalidSession(error)) {
          // The cached login can outlive an account/session deleted in Back4App.
          // Its token is already invalid, so a server logout failure can be ignored.
          await logOut().catch(() => {});
          if (active) {
            setUser(null);
            setMember(null);
            setFamily(null);
          }
        } else {
          setError(error.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [user, reload]);

  function handleAuthenticated(loggedInUser) {
    setError("");
    setLoading(true);
    setMember(null);
    setFamily(null);
    setUser(loggedInUser);
  }

  async function handleCreate(name, memberName) {
    const created = await createFamily(name, memberName);
    // The user may have logged out while the request was running.
    if (currentUser()?.id !== user.id) return;
    setMember(created.member);
    setFamily(created.family);
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError("");
    try {
      await logOut();
      setUser(null);
      setMember(null);
      setFamily(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoggingOut(false);
    }
  }

  if (!parseConfigured) return <SetupPage />;
  if (!user) return <main><AuthPage onAuthenticated={handleAuthenticated} /></main>;

  return (
    <>
      <header>
        <p><strong>Family planner</strong></p>
        <p>Signed in as {user.username}.</p>
        {family && <p>Family: {family.name}</p>}
        <nav aria-label="Main navigation">
          <Link to="/">Overview</Link>{" | "}
          <Link to="/items">Items</Link>{" | "}
          <Link to="/family">Family</Link>
        </nav>
        <p><button type="button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out..." : "Log out"}
        </button></p>
      </header>
      <main>
        {loading ? <p role="status">Loading your family...</p> : error ? (
          <>
            <p role="alert">{error}</p>
            <button type="button" onClick={() => setReload(reload + 1)}>Try again</button>
          </>
        ) : (
          <Routes>
            <Route
              path="/"
              element={family
                ? <OverviewPage key={family.id} family={family} />
                : <Navigate to="/family" replace />}
            />
            <Route
              path="/items"
              element={family
                ? <ItemsPage key={family.id} family={family} member={member} />
                : <Navigate to="/family" replace />}
            />
            <Route
              path="/family"
              element={
                <FamilyPage
                  key={family?.id ?? "new"}
                  user={user}
                  member={member}
                  family={family}
                  onCreate={handleCreate}
                />
              }
            />
            <Route path="*" element={<><h1>Page not found</h1><Link to="/">Back to overview</Link></>} />
          </Routes>
        )}
      </main>
    </>
  );
}
