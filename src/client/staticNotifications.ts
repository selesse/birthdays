import { Temporal } from "@js-temporal/polyfill";
import type { Person } from "../storage/types";

export async function checkBirthdaysAndNotify(): Promise<void> {
  if (!("Notification" in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const raw = localStorage.getItem("birthday_people");
  if (!raw) return;

  let people: Person[];
  try {
    people = JSON.parse(raw) as Person[];
  } catch {
    return;
  }

  const today = Temporal.Now.plainDateISO();
  const todayBirthdays = people.filter((p) => {
    const birth = Temporal.PlainDate.from(p.birthdate);
    return birth.month === today.month && birth.day === today.day;
  });

  for (const person of todayBirthdays) {
    new Notification(`Happy Birthday, ${person.name}!`, {
      body: `Today is ${person.name}'s birthday!`,
      icon: "icon.png",
    });
  }
}
