import type { AgeDifference, Person } from "../App";
import { computeAgeDifference } from "../App";
import "./CompareBar.css";

interface Props {
  people: Person[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

function formatDiff(diff: AgeDifference): string {
  if (diff.years === 0 && diff.months === 0 && diff.days === 0) {
    return "Born on the same day";
  }
  const parts: string[] = [];
  if (diff.years > 0) parts.push(`${diff.years}y`);
  if (diff.months > 0) parts.push(`${diff.months}mo`);
  if (diff.years === 0 && diff.days > 0) parts.push(`${diff.days}d`);
  return parts.join(" ");
}

function Chip({ person, onRemove }: { person: Person; onRemove: () => void }) {
  return (
    <button type="button" className="compare-chip" onClick={onRemove}>
      <span className="compare-chip-avatar">
        {person.name[0].toUpperCase()}
      </span>
      <span className="compare-chip-name">{person.name}</span>
      <span className="compare-chip-remove">×</span>
    </button>
  );
}

export function CompareBar({ people, onRemove, onClose }: Props) {
  const [a, b] = people;

  let diffText: string | null = null;
  if (a && b) {
    const diff = computeAgeDifference(a.birthdate, b.birthdate);
    const older = diff.firstIsOlder ? a : b;
    const younger = diff.firstIsOlder ? b : a;
    diffText =
      diff.years === 0 && diff.months === 0 && diff.days === 0
        ? formatDiff(diff)
        : `${older.name} is ${formatDiff(diff)} older than ${younger.name}`;
  }

  return (
    <div className="compare-bar">
      <div className="compare-bar-content">
        {a ? (
          <Chip person={a} onRemove={() => onRemove(a.id)} />
        ) : (
          <span className="compare-slot-empty">Tap a person</span>
        )}

        {diffText ? (
          <span className="compare-diff">{diffText}</span>
        ) : (
          <span className="compare-diff compare-diff--muted">vs</span>
        )}

        {b ? (
          <Chip person={b} onRemove={() => onRemove(b.id)} />
        ) : (
          <span className="compare-slot-empty">Tap another person</span>
        )}
      </div>

      <button
        type="button"
        className="compare-bar-close"
        onClick={onClose}
        title="Exit compare mode"
      >
        ×
      </button>
    </div>
  );
}
