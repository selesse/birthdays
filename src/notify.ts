import webpush from "web-push";
import { getAllPeople, getAllPushSubscriptions } from "./database";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in .env");
  process.exit(1);
}

webpush.setVapidDetails(
  "mailto:selesse@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

const today = new Date();
const todayMonth = today.getMonth() + 1;
const todayDay = today.getDate();

const people = getAllPeople();
const birthdays = people.filter((p) => {
  const [, month, day] = p.birthdate.split("-").map(Number);
  return month === todayMonth && day === todayDay;
});

if (birthdays.length === 0) {
  console.log("No birthdays today.");
  process.exit(0);
}

const subscriptions = getAllPushSubscriptions();

if (subscriptions.length === 0) {
  console.log("Birthdays today but no push subscriptions registered.");
  process.exit(0);
}

for (const birthday of birthdays) {
  const payload = JSON.stringify({
    title: `Happy Birthday, ${birthday.name}!`,
    body: `Today is ${birthday.name}'s birthday!`,
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      console.log(`Notified: ${birthday.name} → ${sub.endpoint.slice(0, 50)}…`);
    } catch (err) {
      console.error(`Failed to send to ${sub.endpoint.slice(0, 50)}…:`, err);
    }
  }
}
