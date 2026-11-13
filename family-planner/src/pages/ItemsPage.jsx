import { useEffect, useState } from "react";
import Item from "../components/Item.jsx";
import NewItemForm from "../components/NewItemForm.jsx";
import {
  loadItems,
  addItem,
  setItemCompleted,
  deleteItem,
} from "../services/itemService.js";

export default function ItemsPage({ family, member }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!family) return;
      setLoading(true);
      setLoadError("");
      setError("");

      try {
        const loadedItems = await loadItems(family);
        if (active) setItems(loadedItems);
      } catch (error) {
        if (active) setLoadError(error.message || "Could not load items.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [family, reload]);

  async function handleAdd(values) {
    if (saving) return false;
    setSaving(true);
    setError("");

    try {
      const created = await addItem(family, member, values);
      setItems((currentItems) => [...currentItems, created]);
      return true;
    } catch (error) {
      setError(error.message || "Could not add the item.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id) {
    if (saving) return;
    const item = items.find((item) => item.id === id);
    if (!item || item.kind !== "task") return;
    setSaving(true);
    setError("");

    try {
      await setItemCompleted(id, !item.completed);
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === id
            ? { ...currentItem, completed: !item.completed }
            : currentItem,
        ),
      );
    } catch (error) {
      setError(error.message || "Could not update the item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      await deleteItem(id);
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch (error) {
      setError(error.message || "Could not delete the item.");
    } finally {
      setSaving(false);
    }
  }

  if (!family) return <p>Create or join a family to share items.</p>;

  return (
    <section>
      <h1>Items</h1>
      {loading ? (
        <p role="status">Loading items...</p>
      ) : loadError ? (
        <>
          <p role="alert">{loadError}</p>
          <button type="button" onClick={() => setReload(reload + 1)}>
            Try again
          </button>
        </>
      ) : (
        <>
          {error && <p role="alert">{error}</p>}
          <NewItemForm onAdd={handleAdd} disabled={saving} />
          <h2>Family items</h2>
          {items.length === 0 ? (
            <p>No items yet. Add a task or event to get started.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                  disabled={saving}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
