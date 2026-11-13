import { useState } from "react";

export default function FamilyForm({ onCreate }) {
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending || !name.trim() || !memberName.trim()) return;

    setError("");
    setPending(true);

    try {
      await onCreate(name.trim(), memberName.trim());
      setName("");
      setMemberName("");
    } catch (error) {
      setError(error.message || "Could not create the family. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <label htmlFor="family-name">Family name</label>{" "}
        <input
          id="family-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending}
          required
        />
      </p>
      <p>
        <label htmlFor="creator-name">Your name</label>{" "}
        <input id="creator-name" value={memberName} onChange={(event) => setMemberName(event.target.value)} disabled={pending} required />
      </p>
      <p>Creating a family makes you its first adult member.</p>
      <button type="submit" disabled={pending || !name.trim() || !memberName.trim()}>
        {pending ? "Creating family..." : "Create family"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
