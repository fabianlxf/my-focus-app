import { useState } from "react";
import { enablePushForUser, sendTestPush } from "./pushClient";

export default function TestPush() {
  const [status, setStatus] = useState("bereit");

  const userId = "demo-user"; // für MVP fest; später echtes User-Id

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
      setStatus("sende Test-Push…");
      await sendTestPush(userId);
      setStatus("gesendet ✅");
    } catch (e: any) {
      setStatus("Fehler: " + (e?.message || e));
    }
  };

  return (
    <div className="p-4 space-x-2">
      <button onClick={onEnable} className="px-3 py-2 bg-indigo-600 text-white rounded">
        Push aktivieren
      </button>
      <button onClick={onSend} className="px-3 py-2 bg-green-600 text-white rounded">
        Test-Push senden
      </button>
      <span className="ml-3 text-sm">{status}</span>
    </div>
  );
}
