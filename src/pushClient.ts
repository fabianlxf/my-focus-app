// src/pushClient.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

// Helper: Base64 (URL-Safe) → Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

// Registrierung + Subscription speichern
export async function enablePushForUser(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push wird von diesem Browser nicht unterstützt');
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Benachrichtigungs-Erlaubnis abgelehnt');

  const reg = await navigator.serviceWorker.register('/sw.js');
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
  });

  const res = await fetch(`${API_BASE}/api/push/save-subscription`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ userId, subscription: sub })
  });
  if (!res.ok) throw new Error('Subscription speichern fehlgeschlagen');
}

// Test-Push senden
export async function sendTestPush(userId: string) {
  const res = await fetch(`${API_BASE}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      userId,
      title: 'Fokus-Impuls',
      body: 'Mini-Schritt: 3 Atemzüge + 2 Sätze laut üben.',
      url: '/today'
    })
  });
  if (!res.ok) throw new Error('Push senden fehlgeschlagen');
}
