export default function Item({ item, onToggle, onRemove, disabled }) {
  return (
    <li>
      {item.kind === "task" && onToggle ? (
        <label>
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => onToggle(item.id)}
            disabled={disabled}
          />{" "}
          {item.title}
        </label>
      ) : (
        item.title
      )}{" "}
      ({item.kind}){" "}
      {item.kind === "task" && item.dueAt && (
        <>
          — due <time dateTime={item.dueAt.toISOString()}>{item.dueAt.toLocaleString()}</time>{" "}
        </>
      )}
      {item.kind === "event" && item.startsAt && (
        <>
          — <time dateTime={item.startsAt.toISOString()}>{item.startsAt.toLocaleString()}</time>{" "}
          {item.endsAt && (
            <>to <time dateTime={item.endsAt.toISOString()}>{item.endsAt.toLocaleString()}</time>{" "}</>
          )}
        </>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={disabled}
          aria-label={`Delete ${item.kind}: ${item.title}`}
        >
          Delete
        </button>
      )}
    </li>
  );
}
