import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useState } from "react";
import type { Person, StorageAdapter } from "../storage/types";
import { AddBirthday } from "./components/AddBirthday";
import { BirthdayCard } from "./components/BirthdayCard";
import { useSSE } from "./hooks/useSSE";
import { getNotificationStatus, setupPushNotifications } from "./pushSetup";

export type { Person };

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
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [notifStatus, setNotifStatus] = useState<
    "unsupported" | "granted" | "denied" | "default" | "loading"
  >("loading");

  const today = Temporal.Now.plainDateISO();

  async function fetchPeople() {
    const data = await storage.getPeople();
    setPeople(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPeople();
    getNotificationStatus().then(setNotifStatus);
  }, []);

  useSSE(sseUrl, setPeople);

  async function handleAdd(name: string, birthdate: string, note?: string) {
    const data = await storage.addPerson(name, birthdate, note);
    setPeople(data);
    setShowAdd(false);
  }

  async function handleEnableNotifications() {
    const result = await setupPushNotifications();
    setNotifStatus(result === "granted" ? "granted" : result);
  }

  async function handleDelete(id: string) {
    await storage.deletePerson(id);
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleEdit(
    id: string,
    name: string,
    birthdate: string,
    note?: string,
  ) {
    const data = await storage.updatePerson(id, name, birthdate, note);
    setPeople(data);
  }

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  // Sort: birthdays today first, then upcoming soonest, then by name
  const sorted = [...people].sort((a, b) => {
    const ageA = computeAge(a.birthdate, today);
    const ageB = computeAge(b.birthdate, today);
    if (ageA.daysUntilNext !== ageB.daysUntilNext) {
      return ageA.daysUntilNext - ageB.daysUntilNext;
    }
    return a.name.localeCompare(b.name);
  });

  const upcoming = sorted.filter((p) => {
    const age = computeAge(p.birthdate, today);
    return age.daysUntilNext <= 30 && age.daysUntilNext > 0;
  });

  const birthdayToday = sorted.filter((p) => {
    const age = computeAge(p.birthdate, today);
    return age.daysUntilNext === 0;
  });

  const minors = sorted.filter(
    (p) => computeAge(p.birthdate, today).years < 18,
  );
  const adults = sorted.filter(
    (p) => computeAge(p.birthdate, today).years >= 18,
  );

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
              {people.length === 0
                ? "No people added yet"
                : `${people.length} ${people.length === 1 ? "person" : "people"}`}
            </p>
          </div>
        </div>
        <div className="app-header-actions">
          {notifStatus === "default" && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="app-btn-notify"
              title="Enable birthday notifications"
            >
              🔔
            </button>
          )}
          {notifStatus === "denied" && (
            <span
              className="app-btn-notify app-btn-notify--denied"
              title="Notifications blocked in browser settings"
            >
              🔕
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className={`app-btn-add${showAdd ? " app-btn-add--cancel" : ""}`}
          >
            {showAdd ? "Cancel" : "+ Add Birthday"}
          </button>
        </div>
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
            {birthdayToday.map((person) => (
              <BirthdayCard
                key={person.id}
                person={person}
                age={computeAge(person.birthdate, today)}
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
            {upcoming.map((person) => (
              <BirthdayCard
                key={person.id}
                person={person}
                age={computeAge(person.birthdate, today)}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* All people, split by age group */}
      {people.length === 0 ? (
        <div className="app-empty">
          <div className="app-empty-icon">🎂</div>
          <p>Add a person to start tracking birthdays</p>
        </div>
      ) : (
        <>
          {minors.length > 0 && (
            <div className="app-section">
              <h2 className="app-section-heading app-section-heading--all">
                Children
              </h2>
              <div className="app-section-list">
                {minors.map((person) => (
                  <BirthdayCard
                    key={person.id}
                    person={person}
                    age={computeAge(person.birthdate, today)}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {adults.length > 0 && (
            <div className="app-section">
              <h2 className="app-section-heading app-section-heading--all">
                Adults
              </h2>
              <div className="app-section-list">
                {adults.map((person) => (
                  <BirthdayCard
                    key={person.id}
                    person={person}
                    age={computeAge(person.birthdate, today)}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
