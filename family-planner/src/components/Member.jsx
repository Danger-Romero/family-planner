export default function Member({ member }) {
  return (
    <li>
      {member.name} ({member.memberType}) — {member.user ? "has a login account" : "no login account"}
    </li>
  );
}
