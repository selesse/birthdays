import { useState } from "react";

interface Props {
  onAdd: (name: string, birthdate: string, note?: string) => void;
  initial?: { name: string; birthdate: string; note: string | null };
  onCancel?: () => void;
  submitLabel?: string;
}

export function AddBirthday({ onAdd, initial, onCancel, submitLabel = "Add Child" }: Props) {
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0f0f1a",
    border: "1px solid #2d2d44",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#eee",
    fontSize: "0.95rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#888",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#1a1a2e",
        borderRadius: 16,
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <h2 style={{ fontSize: "1.1rem", color: "#eee", fontWeight: 600 }}>
        {submitLabel === "Add Child" ? "Add a Child" : "Edit Child"}
      </h2>

      {error && (
        <div
          style={{
            background: "#2d1a1a",
            border: "1px solid #ff6b6b44",
            color: "#ff6b6b",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Name</label>
        <input
          style={inputStyle}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emma"
          autoFocus
        />
      </div>

      <div>
        <label style={labelStyle}>Birthday</label>
        <input
          style={inputStyle}
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div>
        <label style={labelStyle}>Note (optional)</label>
        <input
          style={inputStyle}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. niece, neighbour's kid..."
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          style={{
            flex: 1,
            background: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "#2d2d44",
              color: "#aaa",
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
