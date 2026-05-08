import { Temporal } from "@js-temporal/polyfill";
import type { Child } from "../storage/types";

export async function checkBirthdaysAndNotify(): Promise<void> {
  if (!("Notification" in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const raw = localStorage.getItem("birthday_children");
  if (!raw) return;

  let children: Child[];
  try {
    children = JSON.parse(raw) as Child[];
  } catch {
    return;
  }

  const today = Temporal.Now.plainDateISO();
  const todayBirthdays = children.filter((c) => {
    const birth = Temporal.PlainDate.from(c.birthdate);
    return birth.month === today.month && birth.day === today.day;
  });

  for (const child of todayBirthdays) {
    new Notification(`Happy Birthday, ${child.name}!`, {
      body: `Today is ${child.name}'s birthday!`,
      icon: "icon.png",
    });
  }
}
