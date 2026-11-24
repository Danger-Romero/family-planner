import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import FamilyPage from "./pages/FamilyPage.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import ItemsPage from "./pages/ItemsPage.jsx";
import PlanWeekPage from "./pages/PlanWeekPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";
import TodayPage from "./pages/TodayPage.jsx";
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
  const navigate = useNavigate();

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
      // Log out lives on the Family page; the next sign-in should start on Today.
      navigate("/", { replace: true });
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
      <main>
        {loading ? <p role="status">Loading your family...</p> : error ? (
          <>
            <p role="alert">{error}</p>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => setReload(reload + 1)}>Try again</Button>
              {/* The Family page isn't shown here, so this is the only way to sign out. */}
              <Button variant="outlined" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? "Logging out..." : "Log out"}
              </Button>
            </Stack>
          </>
        ) : (
          <Routes>
            <Route
              path="/"
              element={family
                ? <TodayPage key={family.id} family={family} member={member} />
                : <Navigate to="/family" replace />}
            />
            {/* The old Overview, no longer in the navigation; kept until it's merged into Today. */}
            <Route
              path="/overview"
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
              path="/calendar"
              element={family ? <CalendarPage key={family.id} family={family}/> : <Navigate to="/family" replace />}
            />
            <Route
              path="/plan-week"
              element={family ? <PlanWeekPage /> : <Navigate to="/family" replace />}
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
                  onLogout={handleLogout}
                  loggingOut={loggingOut}
                />
              }
            />
            <Route path="*" element={<><h1>Page not found</h1><Link to="/">Back to Today</Link></>} />
          </Routes>
        )}
      </main>
      {/* Hidden until there is a family: before that, every tab would lead to Family. */}
      {!loading && !error && family && <NavigationBar />}
    </>
  );
}
