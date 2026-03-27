import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useState } from "react";
import { AddBirthday } from "./components/AddBirthday";
import { BirthdayCard } from "./components/BirthdayCard";
import type { StorageAdapter, Child } from "../storage/types";

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

export function computeAge(birthdate: string, today: Temporal.PlainDate): AgeInfo {
  const birth = Temporal.PlainDate.from(birthdate);

  const totalDays = birth.until(today, { largestUnit: "days" }).days;
  const age = birth.until(today, { largestUnit: "years" });
  const years = age.years;
  const remaining = birth.add({ years }).until(today, { largestUnit: "months" });
  const months = remaining.months;
  const remainingDays = birth.add({ years, months }).until(today, { largestUnit: "days" });
  const days = remainingDays.days;

  // Next birthday this year or next
  let nextBirthday = Temporal.PlainDate.from({
    year: today.year,
    month: birth.month,
    day: birth.day,
  });
  if (Temporal.PlainDate.compare(nextBirthday, today) <= 0) {
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

export function App({ storage, sseUrl }: { storage: StorageAdapter; sseUrl?: string }) {
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

  useEffect(() => {
    if (!sseUrl) return;
    const es = new EventSource(sseUrl);
    es.addEventListener("birthday-added", (e) => {
      const added = JSON.parse(e.data) as Child;
      setChildren((prev) => {
        if (prev.some((c) => c.id === added.id)) return prev;
        return [...prev, added];
      });
    });
    es.addEventListener("birthday-deleted", (e) => {
      const { id } = JSON.parse(e.data) as { id: string };
      setChildren((prev) => prev.filter((c) => c.id !== id));
    });
    es.addEventListener("birthday-updated", (e) => {
      const updated = JSON.parse(e.data) as Child[];
      setChildren(updated);
    });
    return () => es.close();
  }, [sseUrl]);

  async function handleAdd(name: string, birthdate: string, note?: string) {
    const data = await storage.addChild(name, birthdate, note);
    setChildren(data);
    setShowAdd(false);
  }

  async function handleDelete(id: string) {
    await storage.deleteChild(id);
    setChildren((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleEdit(id: string, name: string, birthdate: string, note?: string) {
    const data = await storage.updateChild(id, name, birthdate, note);
    setChildren(data);
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "#888",
        }}
      >
        Loading...
      </div>
    );
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
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#eee" }}>
            Birthday Tracker
          </h1>
          <p style={{ color: "#666", marginTop: 4, fontSize: "0.9rem" }}>
            {children.length === 0
              ? "No children added yet"
              : `${children.length} ${children.length === 1 ? "child" : "children"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: showAdd ? "#2d2d44" : "linear-gradient(135deg, #a29bfe, #6c5ce7)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showAdd ? "Cancel" : "+ Add Birthday"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ marginBottom: 32 }}>
          <AddBirthday onAdd={handleAdd} />
        </div>
      )}

      {/* Birthdays today */}
      {birthdayToday.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1rem", color: "#fdcb6e", fontWeight: 600, marginBottom: 12 }}>
            Today's Birthdays
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "1rem", color: "#00cec9", fontWeight: 600, marginBottom: 12 }}>
            Coming Up (Next 30 Days)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#555",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎂</div>
          <p style={{ fontSize: "1rem" }}>
            Add a child to start tracking birthdays
          </p>
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: "1rem", color: "#888", fontWeight: 600, marginBottom: 12 }}>
            All Children
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
