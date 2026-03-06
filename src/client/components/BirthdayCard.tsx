import { useState } from "react";
import type { AgeInfo, Child } from "../App";
import { AddBirthday } from "./AddBirthday";

interface Props {
  child: Child;
  age: AgeInfo;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string, birthdate: string, note?: string) => void;
}

function ageBadge(age: AgeInfo): string {
  if (age.years === 0) {
    const weeks = Math.floor(age.totalDays / 7);
    return weeks < 2 ? `${age.totalDays}d` : `${weeks}w`;
  }
  if (age.years < 3) {
    return `${age.years * 12 + age.months}mo`;
  }
  return age.months > 0 ? `${age.years}y ${age.months}mo` : `${age.years}y`;
}

function nextBirthdayLabel(age: AgeInfo): { text: string; color: string } {
  if (age.daysUntilNext === 0) {
    return { text: `Turning ${age.turningAge} today!`, color: "#fdcb6e" };
  }
  if (age.daysUntilNext === 1) {
    return { text: `Turning ${age.turningAge} tomorrow`, color: "#fd79a8" };
  }
  if (age.daysUntilNext <= 7) {
    return { text: `Turning ${age.turningAge} in ${age.daysUntilNext}d`, color: "#fd79a8" };
  }
  if (age.daysUntilNext <= 30) {
    return { text: `Turns ${age.turningAge} in ${age.daysUntilNext}d`, color: "#00cec9" };
  }
  return { text: `Turns ${age.turningAge} in ${age.daysUntilNext}d`, color: "#444" };
}

function formatBirthdate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BirthdayCard({ child, age, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { text: nextLabel, color: nextColor } = nextBirthdayLabel(age);
  const isToday = age.daysUntilNext === 0;

  if (editing) {
    return (
      <AddBirthday
        initial={{ name: child.name, birthdate: child.birthdate, note: child.note }}
        onAdd={(name, birthdate, note) => {
          onEdit(child.id, name, birthdate, note);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
        submitLabel="Save Changes"
      />
    );
  }

  return (
    <div
      style={{
        background: isToday ? "linear-gradient(135deg, #2d2418 0%, #1a1a2e 100%)" : "#1a1a2e",
        borderRadius: 10,
        padding: "9px 14px",
        border: isToday ? "1px solid #fdcb6e44" : "1px solid transparent",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: isToday
            ? "linear-gradient(135deg, #fdcb6e, #e17055)"
            : "linear-gradient(135deg, #a29bfe, #6c5ce7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isToday ? "1rem" : "0.85rem",
          flexShrink: 0,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        {isToday ? "🎂" : child.name[0].toUpperCase()}
      </div>

      {/* Name */}
      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#eee", whiteSpace: "nowrap" }}>
        {child.name}
      </span>

      {/* Age badge */}
      <span
        style={{
          background: "#0f0f1a",
          color: "#a29bfe",
          borderRadius: 5,
          padding: "2px 7px",
          fontSize: "0.75rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {ageBadge(age)}
      </span>

      {/* Birthdate + note */}
      <span style={{ color: "#3d3d55", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
        {formatBirthdate(child.birthdate)}
        {child.note && <> · {child.note}</>}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Next birthday */}
      <span
        style={{
          color: nextColor,
          fontSize: "0.8rem",
          fontWeight: 500,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {nextLabel}
      </span>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={() => onDelete(child.id)}
              style={{
                background: "#c0392b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{
                background: "#2d2d44",
                color: "#aaa",
                border: "none",
                borderRadius: 6,
                padding: "5px 8px",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                background: "#2d2d44",
                color: "#888",
                border: "none",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                background: "#2d1a1a",
                color: "#ff6b6b",
                border: "none",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
