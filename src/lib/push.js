// Web Push helpers: service worker registration and subscribing this device.
import { base44 } from "@/api/base44Client";

// VAPID public key (public by design; the private key lives only in Base44 secrets)
export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  "BBehh_pxx3mGC6ZSl1oqs3mgQwqOnrVCujs9oHblH-wbOorUA5v0VbX1Qevm4stHfcapC_glCSVqKYGFFDRF5Hk";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** iOS only allows Web Push for apps added to the Home Screen. */
export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* push is optional */ });
  });
}

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Current push subscription of this device, or null. */
export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Asks permission, subscribes this device and stores the subscription for the signed-in user. */
export async function enablePush() {
  if (!pushSupported()) throw new Error("הדפדפן הזה לא תומך בהתראות");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("ההרשאה להתראות לא אושרה");
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  const json = sub.toJSON();
  const existing = await base44.entities.PushSubscription.filter({ endpoint: json.endpoint });
  if (!existing.length) {
    await base44.entities.PushSubscription.create({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 200),
    });
  }
  return sub;
}

/** Unsubscribes this device and removes its stored subscription. */
export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  const rows = await base44.entities.PushSubscription.filter({ endpoint: sub.endpoint });
  await Promise.all(rows.map((r) => base44.entities.PushSubscription.delete(r.id)));
  await sub.unsubscribe();
}
