import { useState } from "react";

export default function AddMemberForm({ onAdd }) {
  const [name, setName] = useState("");
  const [memberType, setMemberType] = useState("child");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending || !name.trim()) return;
    setError("");
    setSuccess("");
    setPending(true);
    try {
      await onAdd({ name, memberType, username, birthDate });
      setSuccess("Member saved. If that account was already in this family, its existing member was kept.");
      setName("");
      setUsername("");
      setBirthDate("");
      setMemberType("child");
    } catch (error) {
      setError(error.message || "Could not add the member.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <label htmlFor="member-name">Name</label>{" "}
        <input id="member-name" value={name} onChange={(event) => setName(event.target.value)} disabled={pending} required />
      </p>
      <p>
        <label htmlFor="member-type">Member type</label>{" "}
        <select id="member-type" value={memberType} onChange={(event) => setMemberType(event.target.value)} disabled={pending}>
          <option value="child">Child</option>
          <option value="adult">Adult</option>
        </select>
      </p>
      <p>
        <label htmlFor="member-username">Username (optional)</label>{" "}
        <input id="member-username" value={username} onChange={(event) => setUsername(event.target.value)} disabled={pending} />
      </p>
      <p>
        <label htmlFor="member-birth-date">Birth date (optional)</label>{" "}
        <input id="member-birth-date" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} disabled={pending} />
      </p>
      <button type="submit" disabled={pending || !name.trim()}>{pending ? "Adding member..." : "Add member"}</button>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </form>
  );
}
