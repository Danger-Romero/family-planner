export default function AssignmentFields({ members = [], value = [], onChange, disabled = false }) {
  function toggle(memberId, role) {
    const selected = value.some((assignment) =>
      assignment.member === memberId && assignment.role === role,
    );

    onChange(
      selected
        ? value.filter((assignment) =>
            assignment.member !== memberId || assignment.role !== role,
          )
        : [...value, { member: memberId, role }],
    );
  }

  return (
    <>
      {["responsible", "attending"].map((role) => (
        <fieldset key={role} disabled={disabled}>
          <legend>{role === "responsible" ? "Responsible" : "Attending"}</legend>
          {members.map((member) => (
            <p key={member.id}>
              <label>
                <input
                  type="checkbox"
                  checked={value.some((assignment) =>
                    assignment.member === member.id && assignment.role === role,
                  )}
                  onChange={() => toggle(member.id, role)}
                />{" "}
                {member.name}
              </label>
            </p>
          ))}
        </fieldset>
      ))}
    </>
  );
}
