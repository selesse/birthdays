import { Database } from "bun:sqlite";

const DB_PATH = process.env.BIRTHDAY_DB_PATH || "./birthday-tracker.db";

const db = new Database(DB_PATH);

db.run(`
  CREATE TABLE IF NOT EXISTS children (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    birthdate TEXT NOT NULL,
    note      TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh   TEXT NOT NULL,
    auth     TEXT NOT NULL
  )
`);

export interface Child {
  id: number;
  name: string;
  birthdate: string;
  note: string | null;
}

export function addChild(
  name: string,
  birthdate: string,
  note?: string,
): Child {
  const stmt = db.prepare(
    "INSERT INTO children (name, birthdate, note) VALUES (?, ?, ?) RETURNING *",
  );
  return stmt.get(name, birthdate, note ?? null) as Child;
}

export function getAllChildren(): Child[] {
  return db
    .query("SELECT * FROM children ORDER BY birthdate ASC")
    .all() as Child[];
}

export function deleteChild(id: number): void {
  db.run("DELETE FROM children WHERE id = ?", [id]);
}

export function updateChild(
  id: number,
  name: string,
  birthdate: string,
  note?: string,
): void {
  db.run("UPDATE children SET name = ?, birthdate = ?, note = ? WHERE id = ?", [
    name,
    birthdate,
    note ?? null,
    id,
  ]);
}

export interface PushSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function addPushSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
): void {
  db.run(
    "INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)",
    [endpoint, p256dh, auth],
  );
}

export function getAllPushSubscriptions(): PushSubscription[] {
  return db
    .query("SELECT * FROM push_subscriptions")
    .all() as PushSubscription[];
}

export function deletePushSubscription(endpoint: string): void {
  db.run("DELETE FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
}
