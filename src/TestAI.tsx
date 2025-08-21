import { useState } from "react";
import { fetchSuggestions, analyzeGoalProgress } from "./services/aiProxy";
import { enablePushForUser, sendTestPush } from "./pushClient";

export default function TestAI() {
  const [out, setOut] = useState<any>(null);
  const [pushStatus, setPushStatus] = useState<string>("");

  const test = async () => {
    const goals = [{
      id: "g1",
      title: "Sicherer bei Reden werden",
      category: "personal" as const,
      priority: "high" as const,
      progress: 20,
      description: "Redeangst überwinden, 3x pro Woche 10 Minuten üben.",
      createdAt: new Date().toISOString(),
      tags: ["mindset", "public-speaking", "confidence"]
    }];
    const s = await fetchSuggestions(goals);
    const a = await analyzeGoalProgress(goals[0]);
    setOut({ suggestions: s, analysis: a });
  };

  const testPush = async () => {
    try {
      setPushStatus("Registriere Push...");
      await enablePushForUser("test-user-123");
      setPushStatus("Push registriert! Sende Test...");
      
      await sendTestPush("test-user-123");
      setPushStatus("Test-Push gesendet! ✅");
    } catch (e: any) {
      setPushStatus(`Fehler: ${e.message}`);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={test}
        className="px-3 py-2 bg-black text-white rounded mr-2"
      >
        KI testen
      </button>
      
      <button
        onClick={testPush}
        className="px-3 py-2 bg-blue-600 text-white rounded"
      >
        Push testen
      </button>
      
      {pushStatus && (
        <div className="mt-2 text-sm text-gray-600">
          {pushStatus}
        </div>
      )}
      
      <pre className="mt-4 text-sm whitespace-pre-wrap">
        {out ? JSON.stringify(out, null, 2) : "Noch nichts geladen…"}
      </pre>
    </div>
  );
}


