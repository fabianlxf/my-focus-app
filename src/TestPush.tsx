import { useState } from "react";
import { enablePushForUser, sendTestPush } from "./pushClient";

export default function TestPush() {
  const [status, setStatus] = useState("bereit");
  const userId = "demo-user";

  const onEnable = async () => {
    try {
      setStatus("registriere…");
      await enablePushForUser(userId);
      setStatus("registriert ✅");
    } catch (e: any) {
      setStatus("Fehler: " + (e?.message || e));
    }
  };

  const onSend = async () => {
    try {
      setStatus("sende…");
      await sendTestPush(userId);
      setStatus("gesendet ✅");
    } catch (e: any) {
      setStatus("Fehler: " + (e?.message || e));
    }
  };

  return (
    <div className="p-4 space-x-2 bg-black/40 backdrop-blur rounded-xl shadow-lg">
      <button
        onClick={onEnable}
        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
      >
        Push aktivieren
      </button>
      <button
        onClick={onSend}
        className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition"
      >
        Test-Push senden
      </button>
      <span className="ml-3 text-sm text-white/80">{status}</span>
    </div>
  );
}