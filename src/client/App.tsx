import { Temporal } from "@js-temporal/polyfill";
import { useEffect, useRef, useState } from "react";
import type { Person, StorageAdapter } from "../storage/types";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
import { AddBirthday } from "./components/AddBirthday";
import { BirthdayCard } from "./components/BirthdayCard";
import { CompareBar } from "./components/CompareBar";
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

export interface AgeDifference {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  firstIsOlder: boolean;
}

export function computeAgeDifference(
  birthdateA: string,
  birthdateB: string,
): AgeDifference {
  const a = Temporal.PlainDate.from(birthdateA);
  const b = Temporal.PlainDate.from(birthdateB);
  const firstIsOlder = Temporal.PlainDate.compare(a, b) <= 0;
  const older = firstIsOlder ? a : b;
  const younger = firstIsOlder ? b : a;

  const totalDays = older.until(younger, { largestUnit: "days" }).days;
  const years = older.until(younger, { largestUnit: "years" }).years;
  const afterYears = older.add({ years });
  const months = afterYears.until(younger, { largestUnit: "months" }).months;
  const afterMonths = afterYears.add({ months });
  const days = afterMonths.until(younger, { largestUnit: "days" }).days;

  return { years, months, days, totalDays, firstIsOlder };
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
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [notifStatus, setNotifStatus] = useState<
    "unsupported" | "granted" | "denied" | "default" | "loading"
  >("loading");
  const [installable, setInstallable] = useState(false);
  const installPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const today = Temporal.Now.plainDateISO();

  async function fetchPeople() {
    const data = await storage.getPeople();
    setPeople(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPeople();
    getNotificationStatus().then(setNotifStatus);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      installPrompt.current = e as BeforeInstallPromptEvent;
      setInstallable(true);
    };
    const onInstalled = () => setInstallable(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useSSE(sseUrl, setPeople);

  async function handleAdd(name: string, birthdate: string, note?: string) {
    const data = await storage.addPerson(name, birthdate, note);
    setPeople(data);
    setShowAdd(false);
  }

  async function handleInstall() {
    if (!installPrompt.current) return;
    await installPrompt.current.prompt();
    const { outcome } = await installPrompt.current.userChoice;
    if (outcome === "accepted") setInstallable(false);
    installPrompt.current = null;
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

  function handleToggleCompareMode() {
    setCompareMode((v) => !v);
    setShowAdd(false);
    setSelected([]);
  }

  function handleToggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
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
    <div className={`app-root${compareMode ? " app-root--compare" : ""}`}>
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
          {installable && (
            <button
              type="button"
              onClick={handleInstall}
              className="app-btn-install"
              title="Install app"
            >
              Install app
            </button>
          )}
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
            onClick={handleToggleCompareMode}
            className={`app-btn-compare${compareMode ? " app-btn-compare--active" : ""}`}
          >
            {compareMode ? "Cancel" : "Compare Ages"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAdd((v) => !v);
              setCompareMode(false);
              setSelected([]);
            }}
            className={`app-btn-add${showAdd ? " app-btn-add--cancel" : ""}`}
          >
            {showAdd ? "Cancel" : "+ Add Birthday"}
          </button>
        </div>
      </div>

      {compareMode && (
        <CompareBar
          people={selected
            .map((id) => people.find((p) => p.id === id))
            .filter((p): p is Person => !!p)}
          onRemove={handleToggleSelect}
          onClose={handleToggleCompareMode}
        />
      )}

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
                compareMode={compareMode}
                selected={selected.includes(person.id)}
                onToggleSelect={handleToggleSelect}
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
                compareMode={compareMode}
                selected={selected.includes(person.id)}
                onToggleSelect={handleToggleSelect}
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
                    compareMode={compareMode}
                    selected={selected.includes(person.id)}
                    onToggleSelect={handleToggleSelect}
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
                    compareMode={compareMode}
                    selected={selected.includes(person.id)}
                    onToggleSelect={handleToggleSelect}
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
