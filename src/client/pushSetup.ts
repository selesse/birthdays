function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer as ArrayBuffer;
}

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getNotificationStatus(): Promise<
  "unsupported" | "granted" | "denied" | "default"
> {
  if (!isPushSupported()) return "unsupported";
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    const sub = await reg.pushManager.getSubscription();
    if (sub) return "granted";
  }
  return Notification.permission as "granted" | "denied" | "default";
}

export async function setupPushNotifications(): Promise<
  "granted" | "denied" | "error"
> {
  if (!isPushSupported()) return "error";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const res = await fetch("/api/vapid-public-key");
  if (!res.ok) return "error";
  const { publicKey } = (await res.json()) as { publicKey: string };

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  if (existing) return "granted";

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  return "granted";
}
