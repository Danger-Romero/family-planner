import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Item from "../components/Item.jsx";
import { loadItems } from "../services/itemService.js";

export default function OverviewPage({ family }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const loadedItems = await loadItems(family);

        if (!cancelled) {
          setItems(loadedItems);
          setNow(new Date());
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message || "Could not load the overview. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (family) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [family, reload]);

  if (!family) {
    return <p>Create a family or ask a family member to add your username.</p>;
  }

  const unfinishedTasks = items.filter((item) => item.kind === "task" && !item.completed);
  const upcomingEvents = items
    .filter((item) => item.kind === "event" && item.startsAt && (item.endsAt ?? item.startsAt) >= now)
    .sort((first, second) => first.startsAt - second.startsAt);

  return (
    <>
      <h1>Overview</h1>
      {loading ? (
        <p role="status">Loading the overview...</p>
      ) : error ? (
        <>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setReload(reload + 1)}>Try again</button>
        </>
      ) : (
        <>
          <section>
            <h2>Unfinished tasks ({unfinishedTasks.length})</h2>
            {unfinishedTasks.length === 0 ? (
              <p>There are no unfinished tasks.</p>
            ) : (
              <ul>
                {unfinishedTasks.map((item) => <Item key={item.id} item={item} />)}
              </ul>
            )}
          </section>
          <section>
            <h2>Upcoming and ongoing events</h2>
            {upcomingEvents.length === 0 ? (
              <p>There are no upcoming or ongoing events.</p>
            ) : (
              <ul>
                {upcomingEvents.map((item) => <Item key={item.id} item={item} />)}
              </ul>
            )}
          </section>
          <Link to="/items">Manage items</Link>
        </>
      )}
    </>
  );
}
