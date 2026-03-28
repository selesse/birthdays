import { useState } from "react";

interface Props {
  onAdd: (name: string, birthdate: string, note?: string) => void;
  initial?: { name: string; birthdate: string; note: string | null };
  onCancel?: () => void;
  submitLabel?: string;
}

export function AddBirthday({
  onAdd,
  initial,
  onCancel,
  submitLabel = "Add Birthday",
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [birthdate, setBirthdate] = useState(initial?.birthdate ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!birthdate) {
      setError("Birthdate is required");
      return;
    }
    setError(null);
    onAdd(name.trim(), birthdate, note.trim() || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="form-add">
      <h2 className="form-add-title">
        {submitLabel === "Add Birthday" ? "Add a Birthday" : "Edit Birthday"}
      </h2>

      {error && <div className="form-add-error">{error}</div>}

      <div>
        <label className="form-add-label">Name</label>
        <input
          className="form-add-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emma"
        />
      </div>

      <div>
        <label className="form-add-label">Birthday</label>
        <input
          className="form-add-input"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div>
        <label className="form-add-label">Note (optional)</label>
        <input
          className="form-add-input"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. niece, neighbour's kid..."
        />
      </div>

      <div className="form-add-actions">
        <button type="submit" className="form-add-btn-submit">
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="form-add-btn-cancel"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
