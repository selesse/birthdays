import { useRef, useState } from "react";
import type { AgeInfo, Child } from "../App";
import { AddBirthday } from "./AddBirthday";
import "./BirthdayCard.css";

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

function nextBirthdayLabel(age: AgeInfo): { text: string; modifier: string } {
  if (age.daysUntilNext === 0)
    return {
      text: `Turning ${age.turningAge} today!`,
      modifier: "pill--today",
    };
  if (age.daysUntilNext === 1)
    return {
      text: `Turning ${age.turningAge} tomorrow`,
      modifier: "pill--soon",
    };
  if (age.daysUntilNext <= 7)
    return {
      text: `Turning ${age.turningAge} in ${age.daysUntilNext}d`,
      modifier: "pill--soon",
    };
  if (age.daysUntilNext <= 30)
    return {
      text: `Turns ${age.turningAge} in ${age.daysUntilNext}d`,
      modifier: "pill--soon",
    };
  return {
    text: `Turns ${age.turningAge} in ${age.daysUntilNext}d`,
    modifier: "pill--future",
  };
}

function formatBirthdate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ACTION_WIDTH = 120;

export function BirthdayCard({ child, age, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const touchRef = useRef<{
    startX: number;
    startY: number;
    baseOffset: number;
    isHoriz: boolean | null;
  } | null>(null);

  const { text: nextLabel, modifier: pillModifier } = nextBirthdayLabel(age);
  const isToday = age.daysUntilNext === 0;
  const isSwiped = offset < -ACTION_WIDTH * 0.5;

  function handleTouchStart(e: React.TouchEvent) {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      baseOffset: offset,
      isHoriz: null,
    };
    setIsAnimating(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const t = touchRef.current;
    if (!t) return;
    const dx = e.touches[0].clientX - t.startX;
    const dy = e.touches[0].clientY - t.startY;

    if (t.isHoriz === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      t.isHoriz = Math.abs(dx) > Math.abs(dy);
    }
    if (!t.isHoriz) return;

    e.preventDefault();
    setOffset(Math.max(-ACTION_WIDTH, Math.min(0, t.baseOffset + dx)));
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const t = touchRef.current;
    touchRef.current = null;
    setIsAnimating(true);

    if (!t?.isHoriz) return; // tap — onClick handles it

    const dx = e.changedTouches[0].clientX - t.startX;
    const wasSwiped = t.baseOffset < -ACTION_WIDTH * 0.5;

    if (!wasSwiped && dx < -ACTION_WIDTH * 0.35) {
      setOffset(-ACTION_WIDTH);
    } else if (wasSwiped && dx > ACTION_WIDTH * 0.35) {
      setOffset(0);
    } else {
      setOffset(wasSwiped ? -ACTION_WIDTH : 0);
    }
  }

  if (editing) {
    return (
      <AddBirthday
        initial={{
          name: child.name,
          birthdate: child.birthdate,
          note: child.note,
        }}
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
    <div className="card-wrapper">
      {/* Action buttons hidden behind the card, revealed by swiping left */}
      <div className="card-actions-tray">
        <button
          type="button"
          className="card-tray-edit"
          onClick={() => {
            setIsAnimating(true);
            setOffset(0);
            setEditing(true);
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="card-tray-delete"
          onClick={() => {
            setConfirmDelete(true);
            setIsAnimating(true);
            setOffset(0);
          }}
        >
          Delete
        </button>
      </div>

      {/* Card — slides left on swipe to reveal actions */}
      <div
        className={`card-slide${isToday ? " card-slide--today" : ""}`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isAnimating ? "transform 0.2s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (isSwiped) {
            setIsAnimating(true);
            setOffset(0);
            return;
          }
          if (child.note && !confirmDelete) setExpanded((v) => !v);
        }}
      >
        {/* Main row */}
        <div
          className="card-main-row"
          style={{ cursor: child.note ? "pointer" : "default" }}
        >
          {/* Avatar with age badge overlaid */}
          <div className="card-avatar-wrap">
            <div
              className={`card-avatar${isToday ? " card-avatar--today" : ""}`}
            >
              {isToday ? "🎂" : child.name[0].toUpperCase()}
            </div>
            <div className="card-age-badge">{ageBadge(age)}</div>
          </div>

          {/* Name + date */}
          <div className="card-name-block">
            <div className="card-name-row">
              <span className="card-name">{child.name}</span>
              {child.note && (
                <span className="card-chevron">{expanded ? "▲" : "▼"}</span>
              )}
            </div>
            <div className="card-birthdate">
              {formatBirthdate(child.birthdate)}
            </div>
          </div>

          {/* Right side: next birthday pill + desktop buttons */}
          <div className="card-right">
            <span className={`card-next-pill ${pillModifier}`}>
              {nextLabel}
            </span>

            {/* Desktop-only action buttons (hidden on touch devices via CSS) */}
            {!confirmDelete && (
              <div className="card-actions">
                <button
                  type="button"
                  className="card-desktop-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="card-desktop-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expanded note */}
        {expanded && child.note && (
          <div className="card-note">{child.note}</div>
        )}

        {/* Delete confirm — inline banner, works for both swipe (mobile) and button (desktop) */}
        {confirmDelete && (
          <div
            className="card-delete-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="card-delete-label">Delete {child.name}?</span>
            <button
              type="button"
              className="card-delete-btn"
              onClick={() => onDelete(child.id)}
            >
              Delete
            </button>
            <button
              type="button"
              className="card-cancel-btn"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
