import { useEffect, useState } from "react";
import FamilyForm from "../components/FamilyForm.jsx";
import AddMemberForm from "../components/AddMemberForm.jsx";
import Member from "../components/Member.jsx";
import { loadMembers, addMember } from "../services/memberService.js";

export default function FamilyPage({ user, member, family, onCreate }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!family) return;
      setLoading(true);
      setError("");
      try {
        const loadedMembers = await loadMembers(family);
        if (active) setMembers(loadedMembers);
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [family, reload]);

  async function handleAdd(values) {
    const saved = await addMember(values);
    setMembers((currentMembers) =>
      [...currentMembers.filter((each) => each.id !== saved.id), saved]
        .sort((first, second) => first.name.localeCompare(second.name)),
    );
  }

  if (!family) {
    return (
      <>
        <h1>Your family</h1>
        <p>Create a family, or ask an adult family member to add your username: <strong>{user.username}</strong>.</p>
        <p>If someone has just added you, refresh the page to load your family.</p>
        <FamilyForm onCreate={onCreate} />
      </>
    );
  }

  const isAdult = member.memberType === "adult";

  return (
    <>
      <h1>{family.name}</h1>
      <p>You are {member.name} ({member.memberType}).</p>
      <h2>Members</h2>
      {loading ? <p role="status">Loading members...</p> : error ? (
        <>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => setReload(reload + 1)}>Try again</button>
        </>
      ) : (
        <ul>
          {members.map((each) => (
            <Member key={each.id} member={each} />
          ))}
        </ul>
      )}
      {isAdult && !loading && !error ? (
        <>
          <h2>Add a family member</h2>
          <p>A login account is optional. To link one, enter a username that has already signed up.</p>
          <AddMemberForm onAdd={handleAdd} />
        </>
      ) : !isAdult ? <p>Adult family members can add more members.</p> : null}
    </>
  );
}
