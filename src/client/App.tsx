import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useState } from "react";
import type { Child, StorageAdapter } from "../storage/types";
import { AddBirthday } from "./components/AddBirthday";
import { BirthdayCard } from "./components/BirthdayCard";
import { useSSE } from "./hooks/useSSE";

export type { Child };

export interface AgeInfo {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  daysUntilNext: number;
  nextBirthday: string;
  turningAge: number;
}

export function computeAge(
  birthdate: string,
  today: Temporal.PlainDate,
): AgeInfo {
  const birth = Temporal.PlainDate.from(birthdate);

  const totalDays = birth.until(today, { largestUnit: "days" }).days;
  const age = birth.until(today, { largestUnit: "years" });
  const years = age.years;
  const remaining = birth
    .add({ years })
    .until(today, { largestUnit: "months" });
  const months = remaining.months;
  const remainingDays = birth
    .add({ years, months })
    .until(today, { largestUnit: "days" });
  const days = remainingDays.days;

  // Next birthday this year or next
  let nextBirthday = Temporal.PlainDate.from({
    year: today.year,
    month: birth.month,
    day: birth.day,
  });
  if (Temporal.PlainDate.compare(nextBirthday, today) < 0) {
    nextBirthday = Temporal.PlainDate.from({
      year: today.year + 1,
      month: birth.month,
      day: birth.day,
    });
  }

  const daysUntilNext = today.until(nextBirthday, { largestUnit: "days" }).days;
  const turningAge = years + (daysUntilNext === 0 ? 0 : 1);

  return {
    years,
    months,
    days,
    totalDays,
    daysUntilNext,
    nextBirthday: nextBirthday.toString(),
    turningAge,
  };
}

export function App({
  storage,
  sseUrl,
}: { storage: StorageAdapter; sseUrl?: string }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const today = Temporal.Now.plainDateISO();

  async function fetchChildren() {
    const data = await storage.getChildren();
    setChildren(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchChildren();
  }, []);

  useSSE(sseUrl, setChildren);

  async function handleAdd(name: string, birthdate: string, note?: string) {
    const data = await storage.addChild(name, birthdate, note);
    setChildren(data);
    setShowAdd(false);
  }

  async function handleDelete(id: string) {
    await storage.deleteChild(id);
    setChildren((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleEdit(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ) {
    const data = await storage.updateChild(id, name, birthdate, note);
    setChildren(data);
  }

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  // Sort: birthdays today first, then upcoming soonest, then by name
  const sorted = [...children].sort((a, b) => {
    const ageA = computeAge(a.birthdate, today);
    const ageB = computeAge(b.birthdate, today);
    if (ageA.daysUntilNext !== ageB.daysUntilNext) {
      return ageA.daysUntilNext - ageB.daysUntilNext;
    }
    return a.name.localeCompare(b.name);
  });

  const upcoming = sorted.filter((c) => {
    const age = computeAge(c.birthdate, today);
    return age.daysUntilNext <= 30 && age.daysUntilNext > 0;
  });

  const birthdayToday = sorted.filter((c) => {
    const age = computeAge(c.birthdate, today);
    return age.daysUntilNext === 0;
  });

  return (
    <div className="app-root">
      {/* Header */}
      <div className="app-header">
        <div className="app-header-left">
          <img
            src="icon.png"
            alt=""
            width={40}
            height={40}
            className="app-icon"
          />
          <div>
            <h1 className="app-title">Birthday Tracker</h1>
            <p className="app-subtitle">
              {children.length === 0
                ? "No children added yet"
                : `${children.length} ${children.length === 1 ? "child" : "children"}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className={`app-btn-add${showAdd ? " app-btn-add--cancel" : ""}`}
        >
          {showAdd ? "Cancel" : "+ Add Birthday"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="app-section">
          <AddBirthday onAdd={handleAdd} />
        </div>
      )}

      {/* Birthdays today */}
      {birthdayToday.length > 0 && (
        <div className="app-section">
          <h2 className="app-section-heading app-section-heading--today">
            Today's Birthdays
          </h2>
          <div className="app-section-list">
            {birthdayToday.map((child) => (
              <BirthdayCard
                key={child.id}
                child={child}
                age={computeAge(child.birthdate, today)}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming in 30 days */}
      {upcoming.length > 0 && (
        <div className="app-section">
          <h2 className="app-section-heading app-section-heading--upcoming">
            Coming Up (Next 30 Days)
          </h2>
          <div className="app-section-list">
            {upcoming.map((child) => (
              <BirthdayCard
                key={child.id}
                child={child}
                age={computeAge(child.birthdate, today)}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* All children */}
      {children.length === 0 ? (
        <div className="app-empty">
          <div className="app-empty-icon">🎂</div>
          <p>Add a child to start tracking birthdays</p>
        </div>
      ) : (
        <div className="app-section">
          <h2 className="app-section-heading app-section-heading--all">
            All Children
          </h2>
          <div className="app-section-list">
            {sorted.map((child) => (
              <BirthdayCard
                key={child.id}
                child={child}
                age={computeAge(child.birthdate, today)}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
